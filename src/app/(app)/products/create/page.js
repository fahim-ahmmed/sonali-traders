import PageHeader from "@/components/layout/PageHeader";
import ProductForm from "@/components/forms/ProductForm";

export default function AddProductPage() {
  return (
    <>
      <PageHeader group="Product / Add Product" title="Product management" />
      <main className="p-5 sm:p-8">
        <div className="card max-w-2xl p-6">
          <h2 className="text-lg font-bold text-navy-900">Add Product</h2>
          <p className="mb-5 text-sm text-slate-500">Create and manage products, pricing and brand information.</p>
          <ProductForm />
        </div>
      </main>
    </>
  );
}
