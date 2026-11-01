import { PackagePlus } from "lucide-react";
import PageHeader from "@/components/layout/PageHeader";
import FormCard from "@/components/layout/FormCard";
import ProductForm from "@/components/forms/ProductForm";

export default function AddProductPage() {
  return (
    <>
      <PageHeader group="Product / Add Product" title="Product management" />
      <main className="page">
        <FormCard title="Add Product" subtitle="Create and manage products, pricing and brand information." icon={PackagePlus} backHref="/products" backLabel="Product List">
          <ProductForm />
        </FormCard>
      </main>
    </>
  );
}
