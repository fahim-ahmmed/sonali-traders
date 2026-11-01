"use client";
import { useParams } from "next/navigation";
import PageHeader from "@/components/layout/PageHeader";
import ProductForm from "@/components/forms/ProductForm";

export default function EditProductPage() {
  const { id } = useParams();
  return (
    <>
      <PageHeader group="Product / Edit Product" title="Product management" />
      <main className="p-5 sm:p-8">
        <div className="card max-w-2xl p-6">
          <h2 className="mb-5 text-lg font-bold text-navy-900">Edit Product</h2>
          <ProductForm productId={id} />
        </div>
      </main>
    </>
  );
}
