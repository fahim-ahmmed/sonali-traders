"use client";
import { useParams } from "next/navigation";
import { PackageCheck } from "lucide-react";
import PageHeader from "@/components/layout/PageHeader";
import FormCard from "@/components/layout/FormCard";
import ProductForm from "@/components/forms/ProductForm";

export default function EditProductPage() {
  const { id } = useParams();
  return (
    <>
      <PageHeader group="Product / Edit Product" title="Product management" />
      <main className="page">
        <FormCard title="Edit Product" subtitle="Update pricing, brand and stock settings." icon={PackageCheck} backHref="/products" backLabel="Product List">
          <ProductForm productId={id} />
        </FormCard>
      </main>
    </>
  );
}
