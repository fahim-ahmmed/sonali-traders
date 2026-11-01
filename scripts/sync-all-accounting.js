import { readFileSync } from "node:fs";
import path from "node:path";
import mongoose from "mongoose";
import { connectDB, mongoClient } from "../src/lib/db.js";
import { formatMoney } from "../src/lib/money.js";
import { dateFromKey } from "../src/lib/tx-core.js";
import { postEntry } from "../src/lib/ledger.js";
import Customer from "../src/models/Customer.js";
import LedgerEntry from "../src/models/LedgerEntry.js";
import Sale from "../src/models/Sale.js";
import { INVOICES_DATA } from "./accounting-invoices-data.js";

const expected = { count: 105, sales: 1517850000, cost: 1399425000, profit: 118425000, due: 1380282200 };
const args = process.argv.slice(2);
const commit = args.includes("--commit");
const mapArgIndex = args.findIndex((arg) => arg === "--map");
const mapPathArg = args.find((arg) => arg.startsWith("--map="))?.slice("--map=".length);
const mapPath = mapPathArg || (mapArgIndex >= 0 ? args[mapArgIndex + 1] : "");
if (mapArgIndex >= 0 && (!mapPath || mapPath.startsWith("--"))) {
  throw new Error("--map requires a JSON file path.");
}
if (mapPathArg && mapArgIndex >= 0) throw new Error("Provide --map only once.");
const customerOverrides = mapPath
  ? JSON.parse(readFileSync(path.resolve(mapPath), "utf8"))
  : {};

const paisa = (taka) => Math.round(taka * 100);
const cleanName = (name) => name
  .replace(/\s+\((?:Dhalai Special|Fresh Cement|Bashundhara cement)\)$/i, "")
  .trim();
const normalize = (name) => String(name || "").trim().replace(/\s+/g, " ").toLowerCase();
const expectedInvoice = ([invoiceNo, date, customerName, sales, cost, profit, due]) => ({
  invoiceNo,
  date,
  customerName,
  sales: paisa(sales),
  cost: paisa(cost),
  profit: paisa(profit),
  due: paisa(due),
});

function assertDataset(rows) {
  const normalized = rows.map(expectedInvoice);
  const invoiceNos = new Set(normalized.map((row) => row.invoiceNo));
  const totals = normalized.reduce((sum, row) => ({
    sales: sum.sales + row.sales,
    cost: sum.cost + row.cost,
    profit: sum.profit + row.profit,
    due: sum.due + row.due,
  }), { sales: 0, cost: 0, profit: 0, due: 0 });

  if (normalized.length !== expected.count || invoiceNos.size !== expected.count) {
    throw new Error(`Expected ${expected.count} unique invoices; found ${normalized.length} rows and ${invoiceNos.size} invoice numbers.`);
  }
  for (const [key, value] of Object.entries(expected)) {
    if (key !== "count" && totals[key] !== value) {
      throw new Error(`Invoice data ${key} total mismatch: expected ${formatMoney(value)}, got ${formatMoney(totals[key])}.`);
    }
  }
  for (const row of normalized) {
    if (!/^INV-\d{6}$/.test(row.invoiceNo) || !/^\d{4}-\d{2}-\d{2}$/.test(row.date)) {
      throw new Error(`Invalid invoice number or date for ${row.invoiceNo}.`);
    }
    if (row.sales - row.cost !== row.profit) throw new Error(`Sales, cost and profit do not reconcile for ${row.invoiceNo}.`);
    if (row.due < 0 || row.due > row.sales) throw new Error(`Due is outside the sale amount for ${row.invoiceNo}.`);
    if (isNaN(dateFromKey(row.date).getTime())) throw new Error(`Invalid date for ${row.invoiceNo}.`);
  }
  return { rows: normalized, totals };
}

function printTotals(rows, totals) {
  console.log(`Invoices: ${rows.length}`);
  console.log(`Sales: ${formatMoney(totals.sales)}`);
  console.log(`Cost: ${formatMoney(totals.cost)}`);
  console.log(`Profit: ${formatMoney(totals.profit)}`);
  console.log(`Due: ${formatMoney(totals.due)}`);
}

function resolveCustomer(sourceName, byId, byName) {
  const override = customerOverrides[sourceName];
  if (override) {
    const mapped = byId.get(String(override)) || (byName.get(normalize(override)) || []);
    if (Array.isArray(mapped)) return mapped.length === 1 ? mapped[0] : null;
    return mapped || null;
  }
  const exact = byName.get(normalize(sourceName)) || [];
  if (exact.length === 1) return exact[0];
  if (exact.length > 1) return null;
  const cleaned = byName.get(normalize(cleanName(sourceName))) || [];
  return cleaned.length === 1 ? cleaned[0] : null;
}

function customerCandidates(sourceName, byName) {
  const exact = byName.get(normalize(sourceName)) || [];
  return exact.length ? exact : byName.get(normalize(cleanName(sourceName))) || [];
}

async function main(rows, totals) {
  printTotals(rows, totals);
  await connectDB();

  const customers = await Customer.find({ active: true }).select("_id name balance").lean();
  const byId = new Map(customers.map((customer) => [String(customer._id), customer]));
  const byName = new Map();
  for (const customer of customers) {
    const key = normalize(customer.name);
    byName.set(key, [...(byName.get(key) || []), customer]);
  }
  const sourceNames = [...new Set(rows.map((row) => row.customerName))];
  const customerBySource = new Map(sourceNames.map((name) => [name, resolveCustomer(name, byId, byName)]));
  const unresolved = sourceNames.filter((name) => !customerBySource.get(name));
  if (unresolved.length) {
    console.error(`Customer mappings required for ${unresolved.length} invoice labels:`);
    for (const name of unresolved) {
      const candidates = customerCandidates(name, byName);
      const matches = candidates.length
        ? candidates.map((customer) => `${customer.name} (${customer._id})`).join("; ")
        : "no matching active customer";
      console.error(`- ${name} — ${matches}`);
    }
    console.error("Supply exact customer IDs/names in a JSON object and pass --map <file>. No records were written.");
    throw new Error("Customer mapping validation failed.");
  }

  const affectedIds = [...new Set([...customerBySource.values()].map((customer) => String(customer._id)))];
  const ledgerTotals = await LedgerEntry.aggregate([
    { $match: { partyType: "customer", partyId: { $in: customers.map(({ _id }) => _id) } } },
    { $group: { _id: "$partyId", net: { $sum: { $subtract: ["$debit", "$credit"] } } } },
  ]);
  const ledgerByCustomer = new Map(ledgerTotals.map((row) => [String(row._id), row.net]));
  const nonOpeningLedgerTotals = await LedgerEntry.aggregate([
    {
      $match: {
        partyType: "customer",
        partyId: { $in: customers.map(({ _id }) => _id) },
        type: { $nin: ["opening_due", "advance"] },
      },
    },
    { $group: { _id: "$partyId", net: { $sum: { $subtract: ["$debit", "$credit"] } } } },
  ]);
  const nonOpeningByCustomer = new Map(nonOpeningLedgerTotals.map((row) => [String(row._id), row.net]));
  const ledgerMismatches = customers.filter((customer) => (ledgerByCustomer.get(String(customer._id)) || 0) !== (customer.balance || 0));
  if (ledgerMismatches.length) {
    throw new Error(`${ledgerMismatches.length} active customer balance(s) do not match their existing ledger. Resolve these before importing.`);
  }

  const existingSales = await Sale.find({ invoiceNo: { $in: rows.map((row) => row.invoiceNo) } }).lean();
  if (existingSales.length) {
    if (existingSales.length !== rows.length) throw new Error("Some invoice numbers already exist. Partial imports are not overwritten.");
    const saleByInvoice = new Map(existingSales.map((sale) => [sale.invoiceNo, sale]));
    for (const row of rows) {
      const sale = saleByInvoice.get(row.invoiceNo);
      if (!sale || !sale.historicalImport || String(sale.customerId) !== String(customerBySource.get(row.customerName)._id)
        || sale.total !== row.sales || sale.costTotal !== row.cost || sale.paid !== row.sales - row.due
        || dateFromKey(row.date).getTime() !== new Date(sale.date).getTime()) {
        throw new Error(`Existing ${row.invoiceNo} differs from the supplied historical data. No records were written.`);
      }
      const ledger = await LedgerEntry.findOne({ partyType: "customer", partyId: sale.customerId, refId: sale._id, type: "sale" }).lean();
      if (!ledger || ledger.debit !== row.sales || ledger.credit !== row.sales - row.due) {
        throw new Error(`Existing ${row.invoiceNo} is missing its matching customer ledger entry.`);
      }
    }
    console.log("All supplied invoices are already synchronized; no changes are needed.");
    return;
  }

  const dueByCustomer = new Map();
  for (const row of rows) {
    const customerId = String(customerBySource.get(row.customerName)._id);
    dueByCustomer.set(customerId, (dueByCustomer.get(customerId) || 0) + row.due);
  }
  console.log(`Active customers: ${customers.length}`);
  console.log(`Invoice customer records: ${affectedIds.length}`);
  console.log("Customer balances will remain unchanged after ledger reconciliation.");
  if (!commit) {
    console.log("Dry run only. No database records were written. Resolve any mapping errors, review the totals, then pass --commit to execute atomically.");
    return;
  }

  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      const currentCustomers = await Customer.find({ _id: { $in: affectedIds } }).session(session).lean();
      const targetBalances = new Map(currentCustomers.map((customer) => [String(customer._id), customer.balance || 0]));
      if (targetBalances.size !== affectedIds.length) throw new Error("An invoice customer is no longer active.");

      const salesToCreate = rows.map((row) => ({
        invoiceNo: row.invoiceNo,
        historicalImport: true,
        costTotal: row.cost,
        customerId: customerBySource.get(row.customerName)._id,
        date: dateFromKey(row.date),
        items: [],
        total: row.sales,
        paid: row.sales - row.due,
        status: "approved",
        submittedBy: "historical-import",
        submittedByName: "Historical Import",
        approvedBy: "historical-import",
        approvedAt: dateFromKey(row.date),
        remarks: "Historical invoice totals imported; item details were not supplied.",
      }));
      const createdSales = await Sale.create(salesToCreate, { session, ordered: true });
      const saleLedgerEntries = createdSales.map((sale, index) => {
        const row = rows[index];
        return {
          partyId: sale.customerId,
          date: sale.date,
          type: "sale",
          debit: row.sales,
          credit: row.sales - row.due,
          description: `${row.invoiceNo} — Historical sale (aggregate totals only)`,
          refId: sale._id,
        };
      });
      await postEntry(saleLedgerEntries, session);

      const baselineRows = await LedgerEntry.find({
        partyType: "customer",
        partyId: { $in: affectedIds },
        type: { $in: ["opening_due", "advance"] },
      }).sort({ date: 1, createdAt: 1, _id: 1 }).session(session).lean();
      const openingByCustomer = new Map();
      for (const entry of baselineRows) {
        openingByCustomer.set(String(entry.partyId), [...(openingByCustomer.get(String(entry.partyId)) || []), entry]);
      }

      const nonOpeningRows = await LedgerEntry.find({
        partyType: "customer",
        partyId: { $in: affectedIds },
        type: { $nin: ["opening_due", "advance"] },
      }).select("date").session(session).lean();
      const oldestDate = Math.min(
        ...rows.map((row) => dateFromKey(row.date).getTime()),
        ...nonOpeningRows.map((entry) => new Date(entry.date).getTime())
      );
      const openingDate = new Date(oldestDate - 86400000);
      for (const customerId of affectedIds) {
        const target = targetBalances.get(customerId);
        const invoiceDue = dueByCustomer.get(customerId) || 0;
        const nonOpeningNet = nonOpeningByCustomer.get(customerId) || 0;
        const desiredOpening = target - nonOpeningNet - invoiceDue;
        const debit = Math.max(desiredOpening, 0);
        const credit = Math.max(-desiredOpening, 0);
        const openingEntries = openingByCustomer.get(customerId) || [];
        if (openingEntries.length) {
          const [primary, ...superseded] = openingEntries;
          await LedgerEntry.updateOne(
            { _id: primary._id },
            { $set: {
              type: desiredOpening < 0 ? "advance" : "opening_due",
              date: openingDate,
              debit,
              credit,
              description: "Opening balance reconciled with imported historical sales",
              balanceAfter: 0,
            } },
            { session }
          );
          if (superseded.length) {
            await LedgerEntry.updateMany(
              { _id: { $in: superseded.map(({ _id }) => _id) } },
              { $set: { debit: 0, credit: 0, balanceAfter: 0, description: "Superseded by historical invoice reconciliation" } },
              { session }
            );
          }
        } else if (debit || credit) {
          await LedgerEntry.create([{
            partyType: "customer",
            partyId: customerId,
            date: openingDate,
            type: desiredOpening < 0 ? "advance" : "opening_due",
            debit,
            credit,
            description: "Opening balance reconciled with imported historical sales",
          }], { session });
        }
      }

      const balanceWrites = [];
      const dueAfterWrites = [];
      const saleById = new Map(createdSales.map((sale) => [String(sale._id), sale]));
      for (const customerId of affectedIds) {
        const entries = await LedgerEntry.find({ partyType: "customer", partyId: customerId })
          .sort({ date: 1, createdAt: 1, _id: 1 }).session(session).lean();
        let balance = 0;
        for (const entry of entries) {
          balance += (entry.debit || 0) - (entry.credit || 0);
          if (entry.balanceAfter !== balance) {
            balanceWrites.push({ updateOne: { filter: { _id: entry._id }, update: { $set: { balanceAfter: balance } } } });
          }
          const sale = saleById.get(String(entry.refId));
          if (sale && entry.type === "sale") dueAfterWrites.push({ updateOne: { filter: { _id: sale._id }, update: { $set: { dueAfter: balance } } } });
        }
        if (balance !== targetBalances.get(customerId)) {
          throw new Error(`Reconciled ledger does not match the saved target balance for customer ${customerId}.`);
        }
        await Customer.updateOne({ _id: customerId }, { $set: { balance } }, { session });
      }
      if (balanceWrites.length) await LedgerEntry.bulkWrite(balanceWrites, { session, ordered: true });
      if (dueAfterWrites.length) await Sale.bulkWrite(dueAfterWrites, { session, ordered: true });
    });
  } finally {
    await session.endSession();
  }

  console.log(`Committed ${rows.length} approved historical invoices atomically.`);
  console.log(`Invoice due total: ${formatMoney(totals.due)}; customer target balances were preserved.`);
}

try {
  const { rows, totals } = assertDataset(INVOICES_DATA);
  await main(rows, totals);
} catch (error) {
  console.error(error.message || error);
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
  await mongoClient.close();
}
