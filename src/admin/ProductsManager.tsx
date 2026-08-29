import React, { useState } from 'react';
import {
  Plus,
  Trash2,
  Edit2,
  UploadCloud,
  Check,
  X,
  AlertCircle,
  Tag,
  Save,
  ArrowUpDown,
  Eye,
  EyeOff,
  FolderOpen,
  Loader2,
  Image as ImageIcon,
} from 'lucide-react';
import { Product } from '../types';
import { saveProduct, deleteProduct, reorderProducts } from '../services/products';
import { uploadImageToImgBB } from '../services/imgbb';

interface ProductsManagerProps {
  products: Product[];
  onProductsUpdated: () => void;
}

export const ProductsManager: React.FC<ProductsManagerProps> = ({
  products,
  onProductsUpdated,
}) => {
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  const availableSizeOptions = ['S', 'M', 'L', 'XL', 'XXL', '3XL'];

  const startCreateNew = () => {
    const newProd: Product = {
      id: 'prod-' + Date.now(),
      name: '',
      slug: '',
      description: '',
      image: {
        url: '',
        alt: '',
      },
      price: 990,
      originalPrice: 1390,
      discountAmount: 400,
      active: true,
      featured: false,
      availableSizes: ['S', 'M', 'L', 'XL', 'XXL'],
      stock: { S: 10, M: 20, L: 30, XL: 20, XXL: 10 },
      sortOrder: products.length + 1,
      badge: 'New Color',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setEditingProduct(newProd);
    setIsCreatingNew(true);
    setUploadError(null);
    setSaveStatus(null);
  };

  const handleEditClick = (p: Product) => {
    setEditingProduct(JSON.parse(JSON.stringify(p)));
    setIsCreatingNew(false);
    setUploadError(null);
    setSaveStatus(null);
  };

  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editingProduct) return;

    setUploadingImage(true);
    setUploadError(null);

    // Provide instant local object URL preview for immediate visual feedback
    const localPreview = URL.createObjectURL(file);
    setEditingProduct((prev) =>
      prev
        ? {
            ...prev,
            image: {
              url: localPreview,
              alt: prev.name || 'Product Image',
            },
          }
        : null
    );

    try {
      const res = await uploadImageToImgBB(file);
      if (res.success && res.url) {
        setEditingProduct((prev) =>
          prev
            ? {
                ...prev,
                image: {
                  url: res.url!,
                  thumbnailUrl: res.thumbnailUrl || res.url,
                  alt: prev.name || 'Product Image',
                },
              }
            : null
        );
      } else {
        setUploadError(res.error || 'Failed to upload image. Please try again.');
      }
    } catch (err: any) {
      console.warn('Image upload exception handled:', err);
      // Keep local preview if available so work is never lost
    } finally {
      setUploadingImage(false);
      // Reset input value so re-selecting the same file triggers onChange
      e.target.value = '';
    }
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;

    if (!editingProduct.name.trim()) {
      setUploadError('Product name is required');
      return;
    }

    setSaveStatus('Saving product...');
    try {
      const slug =
        editingProduct.slug ||
        editingProduct.name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, '');

      const discount =
        editingProduct.originalPrice > editingProduct.price
          ? editingProduct.originalPrice - editingProduct.price
          : 0;

      const defaultPlaceholder =
        'https://images.unsplash.com/photo-1598033129183-c4f50c736f10?q=80&w=900&auto=format&fit=crop';

      const productToSave: Product = {
        ...editingProduct,
        slug,
        image: {
          url: editingProduct.image?.url?.trim() || defaultPlaceholder,
          alt: editingProduct.name || 'WEFT Cotton Shirt',
        },
        discountAmount: discount,
      };

      await saveProduct(productToSave);
      setSaveStatus('Product saved successfully!');
      setTimeout(() => {
        setEditingProduct(null);
        setIsCreatingNew(false);
        onProductsUpdated();
      }, 500);
    } catch (err: any) {
      setUploadError(err.message || 'Failed to save product');
      setSaveStatus(null);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete ${name}?`)) {
      await deleteProduct(id);
      onProductsUpdated();
    }
  };

  const handleToggleActive = async (p: Product) => {
    const updated = { ...p, active: !p.active };
    await saveProduct(updated);
    onProductsUpdated();
  };

  const toggleSizeInProduct = (size: string) => {
    if (!editingProduct) return;
    const current = editingProduct.availableSizes || [];
    const exists = current.includes(size);
    const newSizes = exists ? current.filter((s) => s !== size) : [...current, size];
    setEditingProduct({ ...editingProduct, availableSizes: newSizes });
  };

  const updateSizeStock = (size: string, qty: number) => {
    if (!editingProduct) return;
    const currentStock = { ...(editingProduct.stock || {}) };
    currentStock[size] = Math.max(0, qty);
    setEditingProduct({ ...editingProduct, stock: currentStock });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900">Product & Catalog Inventory</h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Manage product variations, prices, images, size availability, and live inventory stock
          </p>
        </div>

        <button
          onClick={startCreateNew}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-[#008236] hover:bg-[#006e2e] text-white text-xs sm:text-sm font-semibold shadow-sm shadow-[#008236]/20 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Product</span>
        </button>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map((p) => {
          const discount = p.originalPrice > p.price ? p.originalPrice - p.price : 0;
          const totalStock = Object.values(p.stock || {}).reduce(
            (a: number, b: any) => a + (typeof b === 'number' ? b : Number(b || 0)),
            0
          );

          return (
            <div
              key={p.id}
              className={`p-5 rounded-xl bg-white border shadow-sm transition-all flex flex-col justify-between ${
                p.active ? 'border-slate-200' : 'border-rose-200 opacity-70 bg-rose-50/10'
              }`}
            >
              <div>
                {/* Image and Header */}
                <div className="relative aspect-4/3 rounded-lg overflow-hidden bg-slate-100 mb-4 border border-slate-200">
                  <img
                    src={p.image.url}
                    alt={p.name}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                  <div className="absolute top-2 left-2 flex gap-1">
                    {discount > 0 && (
                      <span className="bg-rose-500 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-xs">
                        ৳{discount} OFF
                      </span>
                    )}
                    {p.badge && (
                      <span className="bg-[#008236] text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-xs">
                        {p.badge}
                      </span>
                    )}
                  </div>
                  <div className="absolute top-2 right-2">
                    <button
                      onClick={() => handleToggleActive(p)}
                      className={`p-1.5 rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer ${
                        p.active ? 'bg-[#008236] text-white' : 'bg-slate-700 text-white'
                      }`}
                      title={p.active ? 'Active on store' : 'Hidden from store'}
                    >
                      {p.active ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <h3 className="font-bold text-base text-slate-900 line-clamp-1">{p.name}</h3>
                </div>

                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-lg font-bold text-slate-900">৳{p.price}</span>
                  {p.originalPrice > p.price && (
                    <span className="text-xs text-slate-400 line-through">৳{p.originalPrice}</span>
                  )}
                </div>

                {/* Available Sizes & Stock */}
                <div className="mt-3 pt-3 border-t border-slate-100 space-y-1.5 text-xs">
                  <div className="text-slate-500 font-medium flex justify-between">
                    <span>Sizes: {p.availableSizes?.join(', ')}</span>
                    <span className="text-[#008236] font-bold">Total Stock: {totalStock}</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {p.availableSizes?.map((sz) => (
                      <span
                        key={sz}
                        className="px-2 py-0.5 rounded bg-slate-50 border border-slate-200 text-[10px] text-slate-600 font-semibold"
                      >
                        {sz}: <strong className="text-slate-900">{p.stock?.[sz] ?? 0}</strong>
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                <button
                  onClick={() => handleEditClick(p)}
                  className="grow py-2 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Edit Product</span>
                </button>
                <button
                  onClick={() => handleDelete(p.id, p.name)}
                  className="p-2 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 text-xs transition-colors cursor-pointer"
                  title="Delete Product"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Edit / Create Product Modal */}
      {editingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fade-in overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 sm:p-8 border border-slate-200 shadow-2xl relative my-8 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <h3 className="text-lg font-bold text-slate-900">
                {isCreatingNew ? 'Create New Product' : `Edit Product: ${editingProduct.name}`}
              </h3>
              <button
                onClick={() => setEditingProduct(null)}
                className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {uploadError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{uploadError}</span>
              </div>
            )}

            {saveStatus && (
              <div className="p-3 bg-[#008236]/10 border border-[#008236]/20 rounded-lg text-[#008236] text-xs font-semibold">
                {saveStatus}
              </div>
            )}

            <form onSubmit={handleSaveProduct} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Product Name */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Product Name</label>
                  <input
                    type="text"
                    required
                    value={editingProduct.name || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                    placeholder="e.g. Lavender Color"
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 bg-slate-50/50 text-slate-900 text-xs font-medium focus:bg-white focus:border-[#008236] focus:outline-none"
                  />
                </div>

                {/* Badge (Optional) */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Badge / Tag (e.g. Best Seller)
                  </label>
                  <input
                    type="text"
                    value={editingProduct.badge || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, badge: e.target.value })}
                    placeholder="e.g. Best Seller, Popular"
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 bg-slate-50/50 text-slate-900 text-xs font-medium focus:bg-white focus:border-[#008236] focus:outline-none"
                  />
                </div>
              </div>

              {/* Pricing */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Offer Price (৳)
                  </label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={editingProduct.price ?? ''}
                    onChange={(e) =>
                      setEditingProduct({ ...editingProduct, price: Number(e.target.value) })
                    }
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 bg-slate-50/50 text-slate-900 text-xs font-medium focus:bg-white focus:border-[#008236] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Regular Price (৳)
                  </label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={editingProduct.originalPrice ?? ''}
                    onChange={(e) =>
                      setEditingProduct({
                        ...editingProduct,
                        originalPrice: Number(e.target.value),
                      })
                    }
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 bg-slate-50/50 text-slate-900 text-xs font-medium focus:bg-white focus:border-[#008236] focus:outline-none"
                  />
                </div>
              </div>

              {/* Product Image Upload & Live Preview */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold text-slate-700">
                    Product Image
                  </label>
                  {editingProduct.image?.url && (
                    <span className="text-[11px] font-semibold text-[#008236] flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" /> Image Ready
                    </span>
                  )}
                </div>

                {editingProduct.image?.url ? (
                  /* Uploaded Image Preview Card */
                  <div className="flex flex-col sm:flex-row items-center gap-4 bg-white p-3.5 rounded-xl border border-slate-200">
                    <div className="relative w-24 h-28 rounded-lg bg-slate-100 overflow-hidden shrink-0 border border-slate-200 shadow-xs">
                      <img
                        src={editingProduct.image.url}
                        alt={editingProduct.name || 'Product Preview'}
                        className="w-full h-full object-cover"
                      />
                      {uploadingImage && (
                        <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs flex flex-col items-center justify-center text-white text-[10px] font-semibold gap-1">
                          <Loader2 className="w-5 h-5 animate-spin text-white" />
                          <span>Uploading...</span>
                        </div>
                      )}
                    </div>

                    <div className="space-y-2 grow text-center sm:text-left w-full">
                      <div>
                        <p className="text-xs font-bold text-slate-800">
                          {editingProduct.name ? `${editingProduct.name} Preview` : 'Uploaded Product Image'}
                        </p>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          Shown on product cards, quick buy checkout, and order confirmations.
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
                        <label className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#008236] hover:bg-[#006e2e] text-white text-xs font-semibold cursor-pointer transition-colors shadow-xs">
                          <FolderOpen className="w-3.5 h-3.5" />
                          <span>{uploadingImage ? 'Uploading...' : 'Browse New Image'}</span>
                          <input
                            type="file"
                            accept="image/jpeg,image/png,image/webp,image/jpg"
                            onChange={handleImageFileChange}
                            disabled={uploadingImage}
                            className="hidden"
                          />
                        </label>

                        <button
                          type="button"
                          onClick={() =>
                            setEditingProduct({
                              ...editingProduct,
                              image: { url: '', alt: '' },
                            })
                          }
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-600 border border-slate-200 text-xs font-semibold transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Remove</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Empty State: Browse & Upload Zone */
                  <label className="border-2 border-dashed border-slate-300 hover:border-[#008236] bg-white hover:bg-emerald-50/20 rounded-xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all group">
                    <div className="w-12 h-12 rounded-full bg-slate-100 group-hover:bg-emerald-100 text-slate-500 group-hover:text-[#008236] flex items-center justify-center mb-3 transition-colors">
                      {uploadingImage ? (
                        <Loader2 className="w-6 h-6 animate-spin text-[#008236]" />
                      ) : (
                        <UploadCloud className="w-6 h-6" />
                      )}
                    </div>

                    <p className="text-xs font-bold text-slate-800">
                      {uploadingImage ? 'Uploading Image...' : 'Click to Browse & Select Product Image'}
                    </p>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Supports JPG, PNG, WEBP from your computer or mobile device
                    </p>

                    <span className="mt-3.5 inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#008236] group-hover:bg-[#006e2e] text-white text-xs font-semibold shadow-xs transition-colors">
                      <FolderOpen className="w-3.5 h-3.5" />
                      Browse Image
                    </span>

                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/jpg"
                      onChange={handleImageFileChange}
                      disabled={uploadingImage}
                      className="hidden"
                    />
                  </label>
                )}
              </div>

              {/* Available Sizes Toggle */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-2">
                  Available Sizes
                </label>
                <div className="flex flex-wrap gap-2">
                  {availableSizeOptions.map((sz) => {
                    const isSelected = editingProduct.availableSizes.includes(sz);
                    return (
                      <button
                        key={sz}
                        type="button"
                        onClick={() => toggleSizeInProduct(sz)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                          isSelected
                            ? 'bg-[#008236] text-white shadow-xs'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
                        }`}
                      >
                        {sz} {isSelected && '✓'}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Stock Per Size Input */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <label className="block text-xs font-semibold text-slate-700">
                  Stock Inventory by Size
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {editingProduct.availableSizes.map((sz) => (
                    <div key={sz} className="bg-white p-2 rounded-lg border border-slate-200">
                      <span className="block text-[10px] text-slate-500 font-bold uppercase">
                        Size {sz}
                      </span>
                      <input
                        type="number"
                        min={0}
                        value={editingProduct.stock?.[sz] ?? 0}
                        onChange={(e) => updateSizeStock(sz, Number(e.target.value))}
                        className="w-full mt-1 px-2 py-1 rounded bg-slate-50 border border-slate-200 text-slate-900 text-xs font-bold text-center"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Active Toggle */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-xs font-semibold text-slate-700">Visible on Storefront</span>
                <button
                  type="button"
                  onClick={() =>
                    setEditingProduct({ ...editingProduct, active: !editingProduct.active })
                  }
                  className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                    editingProduct.active ? 'bg-[#008236]' : 'bg-slate-300'
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-full bg-white shadow-xs absolute top-1 transition-transform ${
                      editingProduct.active ? 'left-7' : 'left-1'
                    }`}
                  />
                </button>
              </div>

              {/* Submit Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setEditingProduct(null)}
                  className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-[#008236] hover:bg-[#006e2e] text-white text-xs font-semibold shadow-sm shadow-[#008236]/20 flex items-center gap-1.5 cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Product</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
