import React, { useMemo, useRef, useState } from 'react';
import {
  ShoppingBag,
  Fuel,
  Droplets,
  Truck,
  Calendar,
  Landmark,
  Copy,
  CheckCircle2,
  AlertCircle,
  Plus,
  Minus,
  Trash2,
  FileCheck2,
  Coins,
  Crown,
  Tag,
} from 'lucide-react';
import { useProtocol } from '../context/ProtocolContext';
import {
  STORE_PRODUCTS,
  STORE_MEDIA,
  IRD_CAPITEC_BANKING,
  STORE_DELIVERY_PERIOD,
  WITHDRAWAL_RULES,
  formatUSD,
  formatZAR,
} from '../data/constants';
import {
  StoreCategory,
  StoreOrderLineItem,
  StorePaymentMethod,
  StoreProduct,
  StorePurchaseOrder,
} from '../types';

export const StoreOrdersView: React.FC = () => {
  const {
    wallet,
    withdrawalEmail,
    currentUser,
    storeOrders,
    submitStorePurchaseOrder,
  } = useProtocol();

  const poFormRef = useRef<HTMLFormElement | null>(null);

  // Deduplicate by SKU / id to guarantee zero repeated products in the store
  const uniqueStoreProducts = useMemo(() => {
    const seen = new Set<string>();
    return STORE_PRODUCTS.filter((p) => {
      if (seen.has(p.sku) || seen.has(p.id)) return false;
      seen.add(p.sku);
      seen.add(p.id);
      return true;
    });
  }, []);

  const [categoryTab, setCategoryTab] = useState<'ALL' | StoreCategory>('ALL');
  const [activeGalleryByProduct, setActiveGalleryByProduct] = useState<Record<string, 'primary' | 'detail'>>({});
  const [productQuantities, setProductQuantities] = useState<Record<string, number>>(() => {
    const init: Record<string, number> = {};
    for (const p of STORE_PRODUCTS) {
      init[p.id] = p.minQty;
    }
    return init;
  });

  // Pre-seed PO builder with 1 Diesel + 1 IRD Bulk Water item so totals & Market Price savings show immediately
  const [poCart, setPoCart] = useState<StoreOrderLineItem[]>(() => {
    const diesel = STORE_PRODUCTS.find((p) => p.id === 'energy-diesel-50ppm') || STORE_PRODUCTS[0];
    const bulkWater = STORE_PRODUCTS.find((p) => p.id === 'water-bulk-wholesale') || STORE_PRODUCTS[2];
    return [
      {
        productId: diesel.id,
        sku: diesel.sku,
        category: diesel.category,
        name: diesel.name,
        unitLabel: diesel.unitLabel,
        quantity: diesel.minQty,
        unitPriceUsd: diesel.priceUsd,
        unitPriceZar: diesel.priceZar,
        marketUnitPriceUsd: diesel.marketPriceUsd,
        marketUnitPriceZar: diesel.marketPriceZar,
        lineTotalUsd: Number((diesel.minQty * diesel.priceUsd).toFixed(2)),
        lineTotalZar: Number((diesel.minQty * diesel.priceZar).toFixed(2)),
      },
      {
        productId: bulkWater.id,
        sku: bulkWater.sku,
        category: bulkWater.category,
        name: bulkWater.name,
        unitLabel: bulkWater.unitLabel,
        quantity: bulkWater.minQty,
        unitPriceUsd: bulkWater.priceUsd,
        unitPriceZar: bulkWater.priceZar,
        marketUnitPriceUsd: bulkWater.marketPriceUsd,
        marketUnitPriceZar: bulkWater.marketPriceZar,
        lineTotalUsd: Number((bulkWater.minQty * bulkWater.priceUsd).toFixed(2)),
        lineTotalZar: Number((bulkWater.minQty * bulkWater.priceZar).toFixed(2)),
      },
    ];
  });

  const [paymentMethod, setPaymentMethod] = useState<StorePaymentMethod>('IRD_CAPITEC_BANKING');
  const [buyerName, setBuyerName] = useState<string>(currentUser?.username || 'Isiphahla Buyer');
  const [companyName, setCompanyName] = useState<string>('Isiphahla Royal Dynasty (Pty) Ltd');
  const [buyerEmail, setBuyerEmail] = useState<string>(withdrawalEmail);
  const [buyerPhone, setBuyerPhone] = useState<string>('');
  const [deliveryAddress, setDeliveryAddress] = useState<string>('');
  const [deliveryProvince, setDeliveryProvince] = useState<string>('KwaZulu-Natal');
  const [bankProofReference, setBankProofReference] = useState<string>('');
  const [orderNotes, setOrderNotes] = useState<string>('');

  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [latestConfirmedOrder, setLatestConfirmedOrder] = useState<StorePurchaseOrder | null>(null);

  const visibleProducts = useMemo(() => {
    if (categoryTab === 'ALL') return uniqueStoreProducts;
    return uniqueStoreProducts.filter((p) => p.category === categoryTab);
  }, [categoryTab, uniqueStoreProducts]);

  const subtotalUsd = useMemo(
    () => Number(poCart.reduce((s, item) => s + item.lineTotalUsd, 0).toFixed(2)),
    [poCart]
  );
  const subtotalZar = useMemo(
    () => Number(poCart.reduce((s, item) => s + item.lineTotalZar, 0).toFixed(2)),
    [poCart]
  );
  const marketSubtotalZar = useMemo(
    () =>
      Number(
        poCart
          .reduce(
            (s, item) => s + (item.marketUnitPriceZar ?? item.unitPriceZar) * item.quantity,
            0
          )
          .toFixed(2)
      ),
    [poCart]
  );
  const marketSubtotalUsd = useMemo(
    () =>
      Number(
        poCart
          .reduce(
            (s, item) => s + (item.marketUnitPriceUsd ?? item.unitPriceUsd) * item.quantity,
            0
          )
          .toFixed(2)
      ),
    [poCart]
  );
  const totalSavingsZar = Math.max(0, Number((marketSubtotalZar - subtotalZar).toFixed(2)));
  const totalSavingsUsd = Math.max(0, Number((marketSubtotalUsd - subtotalUsd).toFixed(2)));
  const requiredBnb = Number((subtotalUsd / WITHDRAWAL_RULES.BNB_PRICE_USD).toFixed(6));

  const estimatedDeliveryDateStr = useMemo(() => {
    const dt = new Date(Date.now() + STORE_DELIVERY_PERIOD.days * 86400000);
    return dt.toLocaleDateString('en-ZA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }, []);

  const handleCopy = (key: string, value: string) => {
    try {
      navigator.clipboard.writeText(value);
      setCopiedField(key);
      setTimeout(() => setCopiedField((prev) => (prev === key ? null : prev)), 2200);
    } catch {}
  };

  const handleCardQtyChange = (product: StoreProduct, nextQty: number) => {
    const sanitized = Math.max(product.minQty, Math.floor(nextQty) || product.minQty);
    setProductQuantities((prev) => ({ ...prev, [product.id]: sanitized }));
  };

  const addProductToPo = (product: StoreProduct, qtyOverride?: number, scrollToForm: boolean = false) => {
    const qty = Math.max(product.minQty, qtyOverride ?? (productQuantities[product.id] || product.minQty));
    setPoCart((prev) => {
      const existing = prev.find((i) => i.productId === product.id);
      if (existing) {
        const nextQty = existing.quantity + qty;
        return prev.map((i) =>
          i.productId === product.id
            ? {
                ...i,
                quantity: nextQty,
                lineTotalUsd: Number((nextQty * product.priceUsd).toFixed(2)),
                lineTotalZar: Number((nextQty * product.priceZar).toFixed(2)),
              }
            : i
        );
      }
      return [
        ...prev,
        {
          productId: product.id,
          sku: product.sku,
          category: product.category,
          name: product.name,
          unitLabel: product.unitLabel,
          quantity: qty,
          unitPriceUsd: product.priceUsd,
          unitPriceZar: product.priceZar,
          marketUnitPriceUsd: product.marketPriceUsd,
          marketUnitPriceZar: product.marketPriceZar,
          lineTotalUsd: Number((qty * product.priceUsd).toFixed(2)),
          lineTotalZar: Number((qty * product.priceZar).toFixed(2)),
        },
      ];
    });
    setFeedback({
      type: 'success',
      text: `Added ${qty.toLocaleString()} × ${product.name} to Purchase Order (${STORE_DELIVERY_PERIOD.label}).`,
    });
    if (scrollToForm && poFormRef.current) {
      poFormRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const updateCartItemQty = (productId: string, delta: number) => {
    const prod = uniqueStoreProducts.find((p) => p.id === productId);
    const minQ = prod?.minQty ?? 1;
    setPoCart((prev) =>
      prev.map((item) => {
        if (item.productId !== productId) return item;
        const nextQty = Math.max(minQ, item.quantity + delta);
        return {
          ...item,
          quantity: nextQty,
          lineTotalUsd: Number((nextQty * item.unitPriceUsd).toFixed(2)),
          lineTotalZar: Number((nextQty * item.unitPriceZar).toFixed(2)),
        };
      })
    );
  };

  const removeCartItem = (productId: string) => {
    setPoCart((prev) => prev.filter((i) => i.productId !== productId));
  };

  const handleSubmitPo = (e: React.FormEvent) => {
    e.preventDefault();
    const res = submitStorePurchaseOrder({
      items: poCart,
      buyerName,
      companyName,
      buyerEmail,
      buyerPhone,
      deliveryAddress,
      deliveryProvince,
      orderNotes,
      paymentMethod,
      bankProofReference,
    });
    setFeedback({
      type: res.success ? 'success' : 'error',
      text: res.message,
    });
    if (res.success && res.order) {
      setLatestConfirmedOrder(res.order);
      setBankProofReference('');
      setOrderNotes('');
    }
  };

  const energyCount = uniqueStoreProducts.filter((p) => p.category === 'ENERGY_BULK').length;
  const waterCount = uniqueStoreProducts.filter((p) => p.category === 'IRD_WATER').length;
  const luxuryCount = uniqueStoreProducts.filter((p) => p.category === 'IRD_LUXURY').length;

  return (
    <div className="space-y-8">
      {/* Header Banner with Market Pricing & Banking Summary */}
      <section className="rounded-3xl bg-zinc-900 border border-zinc-800 p-6 sm:p-8 space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="text-xs font-mono text-amber-400 flex items-center gap-2">
              <ShoppingBag className="w-4 h-4" />
              <span>IRD Blockchain Stores · Energy Bulk, IRD Spring Water & Luxury Collections</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              IRD Store & Purchase Orders (Market Price Verified)
            </h1>
            <p className="text-sm text-zinc-400 leading-relaxed">
              Every item in the IRD Store is unique (1 Diesel, 1 Petroleum, Wholesale & Family Water, and IRD Onchain Luxury Collections) with transparent <strong className="text-white">Market Price</strong> comparisons, <strong className="text-amber-300">3 Weeks (21 Calendar Days)</strong> delivery, and direct <strong className="text-emerald-400">IRD Capitec Business Banking</strong> settlement.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 shrink-0">
            <div className="rounded-2xl bg-zinc-950 border border-zinc-800 p-4 space-y-1">
              <div className="text-[11px] font-mono text-zinc-400 flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-emerald-400" />
                <span>Store Market Pricing</span>
              </div>
              <div className="text-base font-black text-emerald-400">
                100% Indexed
              </div>
              <div className="text-[11px] text-zinc-500 font-mono">
                {uniqueStoreProducts.length} Unique SKUs · Save 8–25% vs Market
              </div>
            </div>

            <div className="rounded-2xl bg-zinc-950 border border-zinc-800 p-4 space-y-1">
              <div className="text-[11px] font-mono text-zinc-400 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-amber-400" />
                <span>Delivery Period</span>
              </div>
              <div className="text-base font-black text-amber-400">
                {STORE_DELIVERY_PERIOD.label}
              </div>
              <div className="text-[11px] text-zinc-500 font-mono">
                ETA if ordered today: {estimatedDeliveryDateStr}
              </div>
            </div>

            <div className="rounded-2xl bg-zinc-950 border border-emerald-500/30 p-4 space-y-1">
              <div className="text-[11px] font-mono text-emerald-400 flex items-center gap-1.5">
                <Landmark className="w-3.5 h-3.5" />
                <span>Store Banking</span>
              </div>
              <div className="text-base font-black text-white">
                {IRD_CAPITEC_BANKING.bankName}
              </div>
              <div className="text-[11px] text-zinc-400 font-mono tabular-nums">
                Acc: {IRD_CAPITEC_BANKING.accountNumber} · {IRD_CAPITEC_BANKING.branchCode}
              </div>
            </div>
          </div>
        </div>

        {/* Supplier Divisions Strip */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 pt-4 border-t border-zinc-800">
          {/* Energy Bulk (1 Diesel & 1 Petroleum) */}
          <div className="rounded-2xl bg-zinc-950 border border-zinc-800 overflow-hidden flex flex-col justify-between">
            <div className="bg-black p-3 border-b border-zinc-800">
              <div className="aspect-video w-full rounded-lg overflow-hidden border border-amber-500/30 bg-black">
                <video
                  src={STORE_MEDIA.ENERGY_BULK_VIDEO}
                  autoPlay
                  loop
                  muted
                  playsInline
                  controls
                  controlsList="nodownload nofullscreen noremoteplayback"
                  className="w-full h-full object-contain bg-black"
                />
              </div>
            </div>
            <div className="p-4 flex items-center justify-between gap-2">
              <div>
                <div className="text-[11px] font-mono text-amber-400 flex items-center gap-1">
                  <Fuel className="w-3.5 h-3.5" />
                  <span>MADLINGWE HOLDINGS · 1 DIESEL & 1 PETROLEUM</span>
                </div>
                <div className="text-xs text-zinc-400 mt-0.5">
                  Market R 23.40–24.15/L · IRD R 21.50–22.25/L
                </div>
              </div>
              <button
                type="button"
                onClick={() => setCategoryTab('ENERGY_BULK')}
                className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-950 font-black text-xs shrink-0 cursor-pointer"
              >
                View Fuel
              </button>
            </div>
          </div>

          {/* IRD Spring Water Bulk Showcase */}
          <div className="rounded-2xl bg-zinc-950 border border-zinc-800 overflow-hidden flex flex-col justify-between">
            <div className="aspect-video w-full bg-zinc-900 overflow-hidden border-b border-zinc-800">
              <img
                src={STORE_MEDIA.IRD_WATER_BULK_IMAGE}
                alt="IRD Spring Water Bulk Wholesale Pallets"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover object-center"
              />
            </div>
            <div className="p-4 flex items-center justify-between gap-2">
              <div>
                <div className="text-[11px] font-mono text-cyan-400 flex items-center gap-1">
                  <Droplets className="w-3.5 h-3.5" />
                  <span>IRD SPRING WATER · BULK & FAMILY</span>
                </div>
                <div className="text-xs text-zinc-400 mt-0.5">
                  Pallet & Family Combo · Save 14–18% vs Market
                </div>
              </div>
              <button
                type="button"
                onClick={() => setCategoryTab('IRD_WATER')}
                className="px-3 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-zinc-950 font-black text-xs shrink-0 cursor-pointer"
              >
                View Water
              </button>
            </div>
          </div>

          {/* IRD Onchain Luxury Collections Showcase */}
          <div className="rounded-2xl bg-zinc-950 border border-zinc-800 overflow-hidden flex flex-col justify-between">
            <div className="aspect-video w-full bg-zinc-900 overflow-hidden border-b border-zinc-800">
              <img
                src={STORE_MEDIA.CROWNS_COLLECTION_IMAGE}
                alt="IRD Blockchain Stores Luxury Collections"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover object-center"
              />
            </div>
            <div className="p-4 flex items-center justify-between gap-2">
              <div>
                <div className="text-[11px] font-mono text-amber-300 flex items-center gap-1">
                  <Crown className="w-3.5 h-3.5" />
                  <span>IRD BLOCKCHAIN STORES · {luxuryCount} UNIQUE COLLECTIONS</span>
                </div>
                <div className="text-xs text-zinc-400 mt-0.5">
                  Watches, Furniture, Crowns, Luggage & Leather
                </div>
              </div>
              <button
                type="button"
                onClick={() => setCategoryTab('IRD_LUXURY')}
                className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-amber-300 font-black text-xs shrink-0 cursor-pointer"
              >
                View Luxury
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Store Category Filter & Unique Goods Catalog */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-1 p-1 rounded-xl bg-zinc-900 border border-zinc-800 overflow-x-auto max-w-full">
            {(
              [
                { id: 'ALL', label: `All Unique Goods (${uniqueStoreProducts.length})` },
                { id: 'ENERGY_BULK', label: `Energy Fuel: 1 Diesel + 1 Petroleum (${energyCount})` },
                { id: 'IRD_WATER', label: `IRD Spring Water (${waterCount})` },
                { id: 'IRD_LUXURY', label: `IRD Luxury Goods (${luxuryCount})` },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setCategoryTab(tab.id)}
                className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  categoryTab === tab.id
                    ? 'bg-amber-500 text-zinc-950'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="text-xs font-mono text-zinc-400 flex items-center gap-2">
            <Truck className="w-4 h-4 text-emerald-400" />
            <span>3-Week Delivery SLA · Live Market Benchmark Displayed on Every SKU</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {visibleProducts.map((product) => {
            const qty = productQuantities[product.id] ?? product.minQty;
            const estZar = qty * product.priceZar;
            const estUsd = qty * product.priceUsd;
            const savingsPct = Math.round(
              ((product.marketPriceZar - product.priceZar) / product.marketPriceZar) * 100
            );
            const activeView = activeGalleryByProduct[product.id] || 'primary';
            const displayImage =
              activeView === 'detail' && product.galleryImage ? product.galleryImage : product.image;

            const categoryTag =
              product.category === 'ENERGY_BULK'
                ? 'ENERGY BULK'
                : product.category === 'IRD_WATER'
                ? 'IRD WATER'
                : 'IRD LUXURY';
            const categoryColor =
              product.category === 'ENERGY_BULK'
                ? 'text-amber-400'
                : product.category === 'IRD_WATER'
                ? 'text-cyan-400'
                : 'text-amber-300';

            return (
              <div
                key={product.id}
                className="rounded-2xl bg-zinc-900 border border-zinc-800 overflow-hidden flex flex-col justify-between"
              >
                <div>
                  {product.videoUrl ? (
                    <div className="bg-black p-3 border-b border-zinc-800">
                      <div className="aspect-video w-full rounded-lg overflow-hidden border border-amber-500/30">
                        <video
                          src={product.videoUrl}
                          muted
                          loop
                          playsInline
                          controls
                          controlsList="nodownload nofullscreen noremoteplayback"
                          className="w-full h-full object-contain bg-black"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="relative aspect-[16/10] w-full bg-zinc-950 overflow-hidden border-b border-zinc-800">
                      <img
                        src={displayImage}
                        alt={product.name}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover object-center"
                      />
                      {product.galleryImage && (
                        <div className="absolute bottom-2 right-2 flex items-center gap-1 bg-zinc-950/85 border border-zinc-700 rounded-lg p-0.5 text-[10px] font-mono">
                          <button
                            type="button"
                            onClick={() =>
                              setActiveGalleryByProduct((prev) => ({ ...prev, [product.id]: 'primary' }))
                            }
                            className={`px-2 py-0.5 rounded cursor-pointer ${
                              activeView === 'primary'
                                ? 'bg-amber-500 text-zinc-950 font-bold'
                                : 'text-zinc-300'
                            }`}
                          >
                            Front
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setActiveGalleryByProduct((prev) => ({ ...prev, [product.id]: 'detail' }))
                            }
                            className={`px-2 py-0.5 rounded cursor-pointer ${
                              activeView === 'detail'
                                ? 'bg-amber-500 text-zinc-950 font-bold'
                                : 'text-zinc-300'
                            }`}
                          >
                            Detail
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="p-4 space-y-2.5">
                    <div className="flex items-center justify-between text-[11px] font-mono">
                      <span className={`${categoryColor} font-bold`}>
                        {categoryTag} · {product.sku}
                      </span>
                      <span className="text-emerald-400 font-bold">
                        -{savingsPct}% vs Market
                      </span>
                    </div>

                    <h3 className="text-sm font-bold text-white leading-snug">{product.name}</h3>
                    <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">
                      {product.description}
                    </p>

                    {/* Market Price vs IRD Store Price Box */}
                    <div className="pt-2.5 border-t border-zinc-800 space-y-1.5 text-xs font-mono tabular-nums">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-zinc-500">Market Price:</span>
                        <span className="text-zinc-400 line-through">
                          {formatZAR(product.marketPriceZar)} ({formatUSD(product.marketPriceUsd)})
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-zinc-400">IRD Store Price:</span>
                        <span className="text-emerald-400 font-black">
                          {formatZAR(product.priceZar)} ({formatUSD(product.priceUsd)})
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-zinc-500">
                        <span className="truncate">{product.marketBenchmarkSource}</span>
                        <span className="shrink-0 ml-2">per {product.unitLabel}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-4 pt-0 space-y-2.5">
                  <div className="flex items-center justify-between gap-2 bg-zinc-950 border border-zinc-800 rounded-xl p-1.5">
                    <button
                      type="button"
                      onClick={() => handleCardQtyChange(product, qty - product.stepQty)}
                      className="p-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 cursor-pointer"
                      title="Decrease Quantity"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <input
                      type="number"
                      min={product.minQty}
                      step={product.stepQty}
                      value={qty}
                      onChange={(e) => handleCardQtyChange(product, Number(e.target.value))}
                      className="w-full text-center bg-transparent text-xs font-mono font-bold text-white tabular-nums focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => handleCardQtyChange(product, qty + product.stepQty)}
                      className="p-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 cursor-pointer"
                      title="Increase Quantity"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="flex items-center justify-between text-[11px] font-mono tabular-nums text-zinc-400 px-0.5">
                    <span>PO Line Est:</span>
                    <span className="text-white font-bold">
                      {formatZAR(estZar)} ({formatUSD(estUsd)})
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => addProductToPo(product, qty, false)}
                      className="py-2 px-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs transition-colors cursor-pointer"
                    >
                      + Add to PO
                    </button>
                    <button
                      type="button"
                      onClick={() => addProductToPo(product, qty, true)}
                      className="py-2 px-3 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:brightness-110 text-zinc-950 font-black text-xs transition-all cursor-pointer"
                    >
                      Order PO
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Market Price Comparison Reference Schedule */}
      <section className="rounded-2xl bg-zinc-900 border border-zinc-800 p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-zinc-800">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Tag className="w-4 h-4 text-emerald-400" />
              <span>IRD Store Complete Market Price Schedule (All {uniqueStoreProducts.length} Unique Products)</span>
            </h2>
            <p className="text-xs text-zinc-400">
              Side-by-side comparison of external Market Benchmark Prices vs IRD Store Purchase Order Prices. Strictly 1 Diesel and 1 Petroleum with zero duplicates.
            </p>
          </div>
          <span className="text-xs font-mono text-amber-300">
            Delivery SLA: {STORE_DELIVERY_PERIOD.label}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="text-zinc-500 border-b border-zinc-800">
                <th className="py-2.5 pr-4 font-semibold">SKU & Product</th>
                <th className="py-2.5 px-4 font-semibold">Market Benchmark</th>
                <th className="py-2.5 px-4 font-semibold text-right">Market Price</th>
                <th className="py-2.5 px-4 font-semibold text-right">IRD Store Price</th>
                <th className="py-2.5 pl-4 font-semibold text-right">Market Savings</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/70 font-mono tabular-nums">
              {uniqueStoreProducts.map((prod) => {
                const saveZar = prod.marketPriceZar - prod.priceZar;
                const savePct = Math.round((saveZar / prod.marketPriceZar) * 100);
                return (
                  <tr key={`mkt-${prod.id}`} className="hover:bg-zinc-800/30 transition-colors">
                    <td className="py-2.5 pr-4">
                      <div className="font-sans font-bold text-white">{prod.name}</div>
                      <div className="text-[11px] text-zinc-500">{prod.sku} · per {prod.unitLabel}</div>
                    </td>
                    <td className="py-2.5 px-4 font-sans text-zinc-400">{prod.marketBenchmarkSource}</td>
                    <td className="py-2.5 px-4 text-right text-zinc-400 line-through">
                      {formatZAR(prod.marketPriceZar)} ({formatUSD(prod.marketPriceUsd)})
                    </td>
                    <td className="py-2.5 px-4 text-right font-bold text-emerald-400">
                      {formatZAR(prod.priceZar)} ({formatUSD(prod.priceUsd)})
                    </td>
                    <td className="py-2.5 pl-4 text-right font-bold text-amber-300">
                      -{savePct}% ({formatZAR(saveZar)})
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* Purchase Order Builder + IRD Capitec Business Banking Checkout */}
      <form
        ref={poFormRef}
        onSubmit={handleSubmitPo}
        className="rounded-3xl bg-zinc-900 border border-amber-500/40 p-6 sm:p-8 space-y-6"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-zinc-800">
          <div>
            <h2 className="text-xl font-black text-white flex items-center gap-2">
              <FileCheck2 className="w-5 h-5 text-amber-400" />
              <span>Purchase Order Checkout — Fuel, Water & IRD Luxury Store</span>
            </h2>
            <p className="text-xs text-zinc-400 mt-1">
              Review line items against Market Price savings, confirm the 3-Week Delivery Period schedule, and settle via IRD Capitec Business Banking EFT or wallet.
            </p>
          </div>
          <div className="px-3.5 py-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs font-mono text-amber-300">
            Delivery Period: <strong>{STORE_DELIVERY_PERIOD.label}</strong> · ETA {estimatedDeliveryDateStr}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: PO Line Items + Delivery Customer Details */}
          <div className="lg:col-span-7 space-y-5">
            {/* PO Cart Items Table */}
            <div className="rounded-2xl bg-zinc-950 border border-zinc-800 p-4 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-300">
                  Purchase Order Line Items ({poCart.length})
                </h3>
                <div className="text-xs font-mono tabular-nums flex items-center gap-3">
                  <span className="text-zinc-500 line-through">
                    Market: {formatZAR(marketSubtotalZar)}
                  </span>
                  <span className="text-emerald-400 font-bold">
                    PO Total: {formatZAR(subtotalZar)} ({formatUSD(subtotalUsd)})
                  </span>
                </div>
              </div>

              {poCart.length === 0 ? (
                <div className="p-6 text-center text-xs text-zinc-500 border border-dashed border-zinc-800 rounded-xl">
                  Your Purchase Order is empty. Add items from the catalog above.
                </div>
              ) : (
                <div className="divide-y divide-zinc-800/80">
                  {poCart.map((item) => {
                    const product = uniqueStoreProducts.find((p) => p.id === item.productId);
                    const step = product?.stepQty ?? 1;
                    const marketUnitZar = item.marketUnitPriceZar ?? item.unitPriceZar;
                    return (
                      <div key={item.productId} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-white truncate">{item.name}</div>
                          <div className="text-[11px] font-mono text-zinc-400">
                            {item.sku} · IRD {formatZAR(item.unitPriceZar)} vs{' '}
                            <span className="line-through text-zinc-500">Mkt {formatZAR(marketUnitZar)}</span> / {item.unitLabel}
                          </div>
                        </div>

                        <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                          <div className="flex items-center gap-1.5 bg-zinc-900 border border-zinc-800 rounded-lg px-1.5 py-1">
                            <button
                              type="button"
                              onClick={() => updateCartItemQty(item.productId, -step)}
                              className="p-1 text-zinc-400 hover:text-white cursor-pointer"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="text-xs font-mono font-bold text-white tabular-nums min-w-[44px] text-center">
                              {item.quantity.toLocaleString()}
                            </span>
                            <button
                              type="button"
                              onClick={() => updateCartItemQty(item.productId, step)}
                              className="p-1 text-zinc-400 hover:text-white cursor-pointer"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>

                          <div className="text-right font-mono tabular-nums min-w-[100px]">
                            <div className="text-xs font-bold text-emerald-400">{formatZAR(item.lineTotalZar)}</div>
                            <div className="text-[10px] text-zinc-500">{formatUSD(item.lineTotalUsd)}</div>
                          </div>

                          <button
                            type="button"
                            onClick={() => removeCartItem(item.productId)}
                            className="p-1.5 rounded-lg bg-zinc-900 hover:bg-rose-950/60 text-zinc-500 hover:text-rose-400 cursor-pointer"
                            title="Remove Line Item"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Delivery & Buyer Form Fields */}
            <div className="rounded-2xl bg-zinc-950 border border-zinc-800 p-4 space-y-4 text-xs">
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-300">
                Buyer & 3-Week Delivery Schedule Details
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-400 font-semibold mb-1">
                    Buyer Full Name *
                  </label>
                  <input
                    type="text"
                    value={buyerName}
                    onChange={(e) => setBuyerName(e.target.value)}
                    placeholder="e.g. King Newboy Dlamini"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-white focus:outline-none focus:border-amber-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-zinc-400 font-semibold mb-1">
                    Company / Entity Name
                  </label>
                  <input
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="e.g. Isiphahla Royal Dynasty (Pty) Ltd"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-zinc-400 font-semibold mb-1">
                    Confirmation Email *
                  </label>
                  <input
                    type="email"
                    value={buyerEmail}
                    onChange={(e) => setBuyerEmail(e.target.value)}
                    placeholder="sovereignstateofsouthafrica@gmail.com"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-emerald-300 font-mono focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-zinc-400 font-semibold mb-1">
                    Contact Phone / WhatsApp *
                  </label>
                  <input
                    type="text"
                    value={buyerPhone}
                    onChange={(e) => setBuyerPhone(e.target.value)}
                    placeholder="+27 82 000 0000"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-white font-mono focus:outline-none focus:border-amber-500"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-zinc-400 font-semibold mb-1">
                    Depot / Delivery Street Address *
                  </label>
                  <input
                    type="text"
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                    placeholder="Street Address, Town/City, Depot Bay or Estate Instructions"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-white focus:outline-none focus:border-amber-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-zinc-400 font-semibold mb-1">
                    Province / Region
                  </label>
                  <select
                    value={deliveryProvince}
                    onChange={(e) => setDeliveryProvince(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="KwaZulu-Natal">KwaZulu-Natal</option>
                    <option value="Gauteng">Gauteng</option>
                    <option value="Western Cape">Western Cape</option>
                    <option value="Eastern Cape">Eastern Cape</option>
                    <option value="Mpumalanga">Mpumalanga</option>
                    <option value="Limpopo">Limpopo</option>
                    <option value="Free State">Free State</option>
                    <option value="North West">North West</option>
                    <option value="Northern Cape">Northern Cape</option>
                    <option value="SADC Export">SADC Export</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-zinc-400 font-semibold mb-1">
                  Purchase Order Instructions / Tanker, Pallet or Size Notes
                </label>
                <textarea
                  rows={2}
                  value={orderNotes}
                  onChange={(e) => setOrderNotes(e.target.value)}
                  placeholder="Specify jacket sizes, tanker offload requirements, or delivery gate instructions (3-week SLA)."
                  className="w-full px-3.5 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>
          </div>

          {/* Right Column: IRD Capitec Business Banking Payment Method & Submit */}
          <div className="lg:col-span-5 space-y-4">
            <div className="rounded-2xl bg-zinc-950 border border-emerald-500/40 p-5 space-y-4">
              <div className="space-y-2">
                <div className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                  <Landmark className="w-4 h-4" />
                  <span>Select Store Payment Method</span>
                </div>

                <div className="grid grid-cols-3 gap-2 text-[11px] font-bold">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('IRD_CAPITEC_BANKING')}
                    className={`py-2 px-2.5 rounded-xl border text-center cursor-pointer transition-colors ${
                      paymentMethod === 'IRD_CAPITEC_BANKING'
                        ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                        : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
                    }`}
                  >
                    IRD Capitec EFT
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('BNB_CHAIN')}
                    className={`py-2 px-2.5 rounded-xl border text-center cursor-pointer transition-colors ${
                      paymentMethod === 'BNB_CHAIN'
                        ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                        : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
                    }`}
                  >
                    BNB Wallet
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('USDT_BEP20')}
                    className={`py-2 px-2.5 rounded-xl border text-center cursor-pointer transition-colors ${
                      paymentMethod === 'USDT_BEP20'
                        ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300'
                        : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
                    }`}
                  >
                    USDT BEP-20
                  </button>
                </div>
              </div>

              {paymentMethod === 'IRD_CAPITEC_BANKING' ? (
                <div className="space-y-3">
                  <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-4 space-y-2.5 text-xs font-mono">
                    <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">
                        {IRD_CAPITEC_BANKING.paymentMethodTitle}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          handleCopy(
                            'allBanking',
                            `Bank name: ${IRD_CAPITEC_BANKING.bankName}\nAccount holder: ${IRD_CAPITEC_BANKING.accountHolder}\nAccount type: ${IRD_CAPITEC_BANKING.accountType}\nAccount number: ${IRD_CAPITEC_BANKING.accountNumber}\nBranch code: ${IRD_CAPITEC_BANKING.branchCode}`
                          )
                        }
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 text-[11px] font-bold cursor-pointer"
                      >
                        <Copy className="w-3 h-3" />
                        <span>{copiedField === 'allBanking' ? 'Copied All' : 'Copy All Details'}</span>
                      </button>
                    </div>

                    <div className="flex items-center justify-between gap-2">
                      <span className="text-zinc-400">Bank name:</span>
                      <button
                        type="button"
                        onClick={() => handleCopy('bankName', IRD_CAPITEC_BANKING.bankName)}
                        className="inline-flex items-center gap-1.5 text-white font-bold hover:text-amber-300 cursor-pointer"
                      >
                        <span>{IRD_CAPITEC_BANKING.bankName}</span>
                        <Copy className="w-3 h-3 text-amber-400" />
                        <span className="text-[10px] text-amber-300">
                          {copiedField === 'bankName' ? 'Copied' : 'Copy'}
                        </span>
                      </button>
                    </div>

                    <div className="flex items-center justify-between gap-2">
                      <span className="text-zinc-400 shrink-0">Account holder:</span>
                      <button
                        type="button"
                        onClick={() => handleCopy('accHolder', IRD_CAPITEC_BANKING.accountHolder)}
                        className="inline-flex items-center gap-1.5 text-emerald-300 font-bold hover:underline cursor-pointer text-right"
                      >
                        <span>{IRD_CAPITEC_BANKING.accountHolder}</span>
                        <Copy className="w-3 h-3 shrink-0" />
                        <span className="text-[10px] shrink-0">
                          {copiedField === 'accHolder' ? 'Copied' : 'Copy'}
                        </span>
                      </button>
                    </div>

                    <div className="flex items-center justify-between gap-2">
                      <span className="text-zinc-400">Account type:</span>
                      <button
                        type="button"
                        onClick={() => handleCopy('accType', IRD_CAPITEC_BANKING.accountType)}
                        className="inline-flex items-center gap-1.5 text-white font-semibold hover:text-amber-300 cursor-pointer"
                      >
                        <span>{IRD_CAPITEC_BANKING.accountType}</span>
                        <Copy className="w-3 h-3 text-amber-400" />
                        <span className="text-[10px] text-amber-300">
                          {copiedField === 'accType' ? 'Copied' : 'Copy'}
                        </span>
                      </button>
                    </div>

                    <div className="flex items-center justify-between gap-2 pt-2 border-t border-zinc-800">
                      <span className="text-zinc-400">Account number:</span>
                      <button
                        type="button"
                        onClick={() => handleCopy('accNo', IRD_CAPITEC_BANKING.accountNumber)}
                        className="inline-flex items-center gap-1.5 text-amber-300 font-black hover:underline cursor-pointer tabular-nums"
                      >
                        <span>{IRD_CAPITEC_BANKING.accountNumber}</span>
                        <Copy className="w-3 h-3" />
                        <span className="text-[10px]">
                          {copiedField === 'accNo' ? 'Copied' : 'Copy'}
                        </span>
                      </button>
                    </div>

                    <div className="flex items-center justify-between gap-2">
                      <span className="text-zinc-400">Branch code:</span>
                      <button
                        type="button"
                        onClick={() => handleCopy('branchCode', IRD_CAPITEC_BANKING.branchCode)}
                        className="inline-flex items-center gap-1.5 text-amber-300 font-bold hover:underline cursor-pointer tabular-nums"
                      >
                        <span>{IRD_CAPITEC_BANKING.branchCode}</span>
                        <Copy className="w-3 h-3" />
                        <span className="text-[10px]">
                          {copiedField === 'branchCode' ? 'Copied' : 'Copy'}
                        </span>
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs text-zinc-400 font-semibold mb-1">
                      Capitec EFT Reference / Proof of Payment ID (Optional)
                    </label>
                    <input
                      type="text"
                      value={bankProofReference}
                      onChange={(e) => setBankProofReference(e.target.value)}
                      placeholder="e.g. CAP-EFT-2026-0891 (or leave blank to get auto ref)"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-white text-xs font-mono focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>
              ) : (
                <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-4 space-y-2 text-xs font-mono">
                  <div className="flex items-center gap-2 text-amber-300 font-bold">
                    <Coins className="w-4 h-4" />
                    <span>
                      {paymentMethod === 'BNB_CHAIN'
                        ? 'Pay Directly from Connected BNB Wallet'
                        : 'Pay Directly with BEP-20 USDT Balance'}
                    </span>
                  </div>
                  <div className="flex justify-between text-zinc-400">
                    <span>Available Balance:</span>
                    <span className="text-white font-bold tabular-nums">
                      {paymentMethod === 'BNB_CHAIN'
                        ? `${wallet.balances.BNB.toFixed(4)} BNB`
                        : `${wallet.balances.USDT.toFixed(2)} USDT`}
                    </span>
                  </div>
                  <div className="flex justify-between text-zinc-400">
                    <span>Required Total:</span>
                    <span className="text-emerald-400 font-bold tabular-nums">
                      {paymentMethod === 'BNB_CHAIN'
                        ? `${requiredBnb.toFixed(5)} BNB (${formatUSD(subtotalUsd)})`
                        : `${formatUSD(subtotalUsd)} USDT`}
                    </span>
                  </div>
                </div>
              )}

              {/* Totals Summary & Market Price Savings */}
              <div className="pt-3 border-t border-zinc-800 space-y-2 text-xs font-mono tabular-nums">
                <div className="flex justify-between text-zinc-500">
                  <span>Market Value (ZAR):</span>
                  <span className="line-through">
                    {formatZAR(marketSubtotalZar)} ({formatUSD(marketSubtotalUsd)})
                  </span>
                </div>
                <div className="flex justify-between text-amber-300">
                  <span>Market Discount Saved:</span>
                  <span className="font-bold">
                    -{formatZAR(totalSavingsZar)} (-{formatUSD(totalSavingsUsd)})
                  </span>
                </div>
                <div className="flex justify-between text-zinc-300 pt-1 border-t border-zinc-800/80">
                  <span>IRD PO Total (ZAR):</span>
                  <span className="text-white font-black text-sm">{formatZAR(subtotalZar)}</span>
                </div>
                <div className="flex justify-between text-zinc-400">
                  <span>USD Equivalent:</span>
                  <span className="text-emerald-400 font-bold">{formatUSD(subtotalUsd)}</span>
                </div>
                <div className="flex justify-between text-zinc-400">
                  <span>Delivery SLA:</span>
                  <span className="text-amber-300 font-bold">{STORE_DELIVERY_PERIOD.label}</span>
                </div>
              </div>

              <button
                type="submit"
                disabled={poCart.length === 0}
                className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:brightness-110 disabled:opacity-50 text-zinc-950 font-black text-sm shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
              >
                Submit Purchase Order ({formatZAR(subtotalZar)})
              </button>
            </div>
          </div>
        </div>

        {feedback && (
          <div
            className={`p-4 rounded-xl border text-xs flex items-start gap-2.5 ${
              feedback.type === 'success'
                ? 'bg-emerald-950/70 border-emerald-700 text-emerald-300'
                : 'bg-rose-950/70 border-rose-700 text-rose-300'
            }`}
          >
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            )}
            <span>{feedback.text}</span>
          </div>
        )}

        {latestConfirmedOrder && (
          <div className="rounded-2xl bg-emerald-950/35 border border-emerald-500/40 p-5 space-y-2 text-xs font-mono">
            <div className="text-emerald-400 font-black text-sm">
              Purchase Order Confirmed — {latestConfirmedOrder.poNumber}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-zinc-300">
              <div>
                Payment Ref: <span className="text-white font-bold">{latestConfirmedOrder.paymentReference}</span>
              </div>
              <div>
                Delivery Period: <span className="text-amber-300 font-bold">{latestConfirmedOrder.deliveryPeriodLabel}</span>
              </div>
              <div>
                Est. Delivery Date:{' '}
                <span className="text-emerald-300 font-bold">
                  {new Date(latestConfirmedOrder.estimatedDeliveryAt).toLocaleDateString()}
                </span>
              </div>
            </div>
            {latestConfirmedOrder.bankAccountUsed && (
              <div className="text-[11px] text-zinc-400 pt-1">
                Remit EFT to: {latestConfirmedOrder.bankAccountUsed.bankName} · {latestConfirmedOrder.bankAccountUsed.accountHolder} · Acc {latestConfirmedOrder.bankAccountUsed.accountNumber} · Branch {latestConfirmedOrder.bankAccountUsed.branchCode}
              </div>
            )}
          </div>
        )}
      </form>

      {/* Submitted Purchase Orders Ledger */}
      <section className="rounded-2xl bg-zinc-900 border border-zinc-800 p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-zinc-800">
          <div>
            <h2 className="text-base font-bold text-white">
              Store Purchase Orders Ledger
            </h2>
            <p className="text-xs text-zinc-400">
              All confirmed Purchase Orders carry a 3-Week (21-Day) fulfillment & dispatch schedule.
            </p>
          </div>
          <span className="text-xs font-mono text-zinc-500">
            {storeOrders.length} Submitted POs
          </span>
        </div>

        {storeOrders.length === 0 ? (
          <div className="p-6 text-center text-xs text-zinc-500 border border-dashed border-zinc-800 rounded-xl">
            No Store Purchase Orders submitted yet. Add items and submit your first PO above.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-zinc-500 border-b border-zinc-800">
                  <th className="py-2.5 pr-4 font-semibold">PO Number</th>
                  <th className="py-2.5 px-4 font-semibold">Items</th>
                  <th className="py-2.5 px-4 font-semibold">Payment Method & Ref</th>
                  <th className="py-2.5 px-4 font-semibold">3-Week Delivery ETA</th>
                  <th className="py-2.5 pl-4 font-semibold text-right">Order Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/70 font-mono tabular-nums">
                {storeOrders.map((po) => (
                  <tr key={po.id} className="hover:bg-zinc-800/30 transition-colors">
                    <td className="py-2.5 pr-4">
                      <div className="text-white font-bold">{po.poNumber}</div>
                      <div className="text-[11px] text-zinc-400 font-sans">{po.buyerName} · {po.deliveryProvince}</div>
                    </td>
                    <td className="py-2.5 px-4 font-sans text-zinc-300">
                      {po.items.map((it) => `${it.quantity.toLocaleString()} × ${it.name}`).join(', ')}
                    </td>
                    <td className="py-2.5 px-4">
                      <span className="text-emerald-400 font-bold block">
                        {po.paymentMethod === 'IRD_CAPITEC_BANKING'
                          ? 'IRD Capitec Business Banking (Acc 1055652493)'
                          : po.paymentMethod}
                      </span>
                      <span className="text-[11px] text-zinc-400">Ref: {po.paymentReference}</span>
                    </td>
                    <td className="py-2.5 px-4 text-amber-300">
                      {new Date(po.estimatedDeliveryAt).toLocaleDateString()} ({po.deliveryPeriodLabel})
                    </td>
                    <td className="py-2.5 pl-4 text-right font-bold text-white">
                      {formatZAR(po.totalZar)}
                      <span className="block text-[11px] text-zinc-400">{formatUSD(po.totalUsd)}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
};
