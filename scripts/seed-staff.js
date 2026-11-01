import mongoose from "mongoose";
import { connectDB, mongoClient } from "../src/lib/db.js";
import { formatMoney } from "../src/lib/money.js";
import Staff from "../src/models/Staff.js";

const STAFF = [
  { sortOrder: 1, name: "Ali Haider", designation: "Sales Officer", phone: "01925379359", email: "Alihaiderkst@gmail.com", salary: 5000000 },
  { sortOrder: 2, name: "Sayed Romeo", designation: "Sales Officer", phone: "01933160618", email: "Sayedhasan7329@gmail.com", salary: 1500000 },
  { sortOrder: 3, name: "MD Akash", designation: "Sales Officer", phone: "01615950096", email: "asshoaib688@gmail.com", salary: 1200000 },
  { sortOrder: 4, name: "Boshir Ahammed Ronok", designation: "Software Engineer", phone: "01706358357", email: "admin@gmail.com", salary: 5000000 },
  { sortOrder: 5, name: "Raju Ahammed", designation: "Sales Officer", phone: "01716659084", email: "razuahammedkst7298@gmail.com", salary: 1600000 },
  { sortOrder: 6, name: "Mojibor Rahmar", designation: "Sales Officer", phone: "01787403487", email: "mojibarkst87@gmail.com", salary: 1500000 },
  { sortOrder: 7, name: "Mahaddes Ali", designation: "Sales Officer", phone: "01320471717", email: "mahaddesshanta@gmail.com", salary: 1000000 },
  { sortOrder: 8, name: "Shawon Hossain", designation: "Sales Officer", phone: "01787404461", email: "shawonkst69@gmail.com", salary: 1000000 },
];

const expectedSalary = 17800000;
const emails = STAFF.map(({ email }) => email.toLowerCase());

try {
  await connectDB();

  for (const person of STAFF) {
    const email = person.email.toLowerCase();
    await Staff.updateOne(
      { email },
      {
        $setOnInsert: {
          ...person,
          email,
          userId: `staff-profile:${email}`,
          address: "",
          active: true,
        },
      },
      { upsert: true }
    );
  }

  const saved = await Staff.find({ email: { $in: emails } }).select("email salary").lean();
  const salaryTotal = saved.reduce((total, person) => total + person.salary, 0);

  console.log(`Staff profiles: ${saved.length}`);
  console.log(`Total salary: ${formatMoney(salaryTotal)}`);
  if (saved.length !== STAFF.length || salaryTotal !== expectedSalary) {
    throw new Error(`Staff seed verification failed: expected ${STAFF.length} profiles and ${formatMoney(expectedSalary)} total salary.`);
  }
} finally {
  await mongoose.disconnect();
  await mongoClient.close();
}
