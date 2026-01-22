// ============================================================================
// IMPORTS
// ============================================================================

import { useEffect, useMemo, useRef, useState, memo } from "react";
import {
  Phone,
  MapPin,
  Check,
  Plus,
  Minus,
  ShoppingBag,
  Truck,
  DollarSign,
  Headphones,
  Award,
} from "lucide-react";
import logoImg from "./assets/logo.png";
import photo1 from "./assets/556882990_1219622656851052_8768942022743195469_n.jpg";
import photo2 from "./assets/558440708_1219622400184411_6437028368072389860_n.jpg";
import photo3 from "./assets/558989342_1219622760184375_8826584400446898894_n.jpg";
import photo4 from "./assets/559127112_1219622513517733_3897607277409627272_n.jpg";
import ProductCard from "./ProductCard";
import { addOrder } from "./api";
import Swal from "sweetalert2";
import citiesData from "./cities.json";


// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function ProductPage() {
  // Default company/subCategories
  // Read IDs from environment (Vite) with fallbacks for local dev
  const DEFAULT_COMPANY_ID = import.meta.env.VITE_CRM_COMPANY_ID ;
  const DEFAULT_SUBCATS = [import.meta.env.VITE_CRM_CATEGORY_ID ];
  const DEFAULT_BRANCH_ID = import.meta.env.VITE_CRM_BRANCH_ID ;

  // Product details
  const productDetails = {
    name: "كورن فليكس شاور — ٥ أطعم",
    price: 90,
    description: "كورن فليكس شاور — ٥ نكهات لذيذة ومقرمشة لبدء يومك بأحلى طعم.",
    pieces: ["٥ نكهات مختلفة"],
    features: [
      "مقرمش ولذيذ",
      "عبوة منفصلة لكل طعم للحفاظ على النكهة",
      "متاح داخل المعرض أو للتوصيل",
    ],
    specs: {
      brand: "شاور كورن فليكس",
      count: "قطعة",
      material: "حبوب ذرة محمصة",
      colors: "متعدد النكهات",
    },
  };

  // Gallery media (video first, then images)
  const galleryMedia = [
    { type: "image", src: photo1 },
    { type: "image", src: photo2 },
    { type: "image", src: photo3 },
    { type: "image", src: photo4 },
  ];

  // --------------------------------------------------------------------------
  // STATE MANAGEMENT
  // --------------------------------------------------------------------------

  const [currentMedia, setCurrentMedia] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Selected photos by gallery index
  const [selectedPhotos, setSelectedPhotos] = useState([]);
  // Product card selections (flavors)
  const [selectedItems, setSelectedItems] = useState({});


  const toggleItem = (id) => {
    setSelectedItems((s) => {
      const exists = Boolean(s[id]);
      if (exists) {
        const next = { ...s };
        delete next[id];
        return next;
      }
      return { ...s, [id]: 1 };
    });
  };

  const changeItemQuantity = (id, delta) => {
    setSelectedItems((s) => {
      const current = s[id] || 0;
      const nextCount = Math.max(0, current + delta);
      if (nextCount === 0) {
        const next = { ...s };
        delete next[id];
        return next;
      }
      return { ...s, [id]: nextCount };
    });
  };

  const videoRef = useRef(null);
  const userUnmutedRef = useRef(false);
  const [isMuted, setIsMuted] = useState(true);
  const [formData, setFormData] = useState({ name: "", phone: "", province: "", city: "", address: "", isWhatsapp: false, whatsappNumber: "", note: "", promoCode: "" });
  const [copiedPromo, setCopiedPromo] = useState("");

  // --------------------------------------------------------------------------
  // LOOKUPS
  // --------------------------------------------------------------------------

  const citiesByName = useMemo(() => {
    const m = new Map();
    (citiesData || []).forEach((c) => {
      if (c && c.name) m.set(String(c.name).toLowerCase(), c._id);
    });
    return m;
  }, []);

  const citiesById = useMemo(() => {
    const m = new Map();
    (citiesData || []).forEach((c) => {
      if (c && c._id) m.set(c._id, c.name);
    });
    return m;
  }, []);


  // --------------------------------------------------------------------------
  // CALCULATIONS
  // --------------------------------------------------------------------------

  const perUnitPrice = productDetails.price || 90;
  // Single unit and 5-piece bundle
  const offers = [
    { count: 1, price: perUnitPrice },
    { count: 5, price: 300 },
  ];

  const [selectedOffer, setSelectedOffer] = useState(0);

  // example flavors based on the available images
  const flavors = [
    { id: 'flav1', name: 'نكهة ١', price: perUnitPrice, image: photo1 },
    { id: 'flav2', name: 'نكهة ٢', price: perUnitPrice, image: photo2 },
    { id: 'flav3', name: 'نكهة ٣', price: perUnitPrice, image: photo3 },
    { id: 'flav4', name: 'نكهة ٤', price: perUnitPrice, image: photo4 },
    { id: 'flav5', name: 'نكهة ٥', price: perUnitPrice, image: photo1 },
  ];

  // Compute subtotal depending on selected offer or selected items (from ProductCard selections)
  const selectedItemsCount = Object.values(selectedItems || {}).reduce((a, b) => a + (Number(b) || 0), 0);
  // If bundle (5) is selected, base price covers first 5 items; extras are per-unit
  const subtotal = (offers[selectedOffer] && typeof offers[selectedOffer].price === 'number' && offers[selectedOffer].count === 5)
    ? offers[selectedOffer].price + Math.max(0, selectedItemsCount - offers[selectedOffer].count) * perUnitPrice
    : selectedItemsCount * perUnitPrice;

  // Shipping fee (default 0). Promo code 'Shower-delivery' keeps shipping 0.
  const shippingFee = 0;

  // Promo discount: shower-offer gives 90 EGP off for subtotal >= 270
  const promoCode = (formData && formData.promoCode) ? String(formData.promoCode).trim() : "";
  // Promo codes are disabled when the 5-item bundle is selected
  const promoDiscount = selectedOffer === 1
    ? 0
    : (promoCode.toLowerCase() === 'shower-offer' && subtotal >= 270 ? 90 : 0);

  const grandTotal = subtotal - promoDiscount + shippingFee;
  const deliveryLabel = shippingFee === 0 ? "مجانا" : `${shippingFee} جنيه`;

  // --------------------------------------------------------------------------
  // HANDLERS
  // --------------------------------------------------------------------------

  const handleMediaClick = (index) => {
    setCurrentMedia(index);
    if (galleryMedia[index].type === "video" && videoRef.current) {
      // mark that the user interacted and prefers sound
      try {
        // do not unmute on media click — mute state is controlled only by the button
      } catch (e) {}
      try {
        videoRef.current.volume = 1;
      } catch (err) {}
      videoRef.current.load();
      videoRef.current.play().catch(() => {});
    }
  };

  const togglePhotoSelect = (index) => {
    setSelectedPhotos((prev) => {
      const exists = prev.includes(index);
      if (exists) return prev.filter((i) => i !== index);
      // allow selecting up to 10 (or any number) but bundle checks will enforce 5
      return [...prev, index];
    });
    // also preview the clicked media in the main display
    try { setCurrentMedia(index); } catch (e) {}
  };

  const handleQuantityChange = (delta) => {
    setQuantity((prev) => Math.max(1, prev + delta));
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((s) => ({ ...s, [name]: type === "checkbox" ? checked : value }));
  };

  // Attempt autoplay on mount (may be blocked by browser if autoplay with sound is not allowed)
  useEffect(() => {
    try {
      const v = videoRef.current;
      if (v && galleryMedia[currentMedia]?.type === "video") {
        v.loop = true;
        // respect explicit mute state
        v.muted = !!isMuted;
        v.volume = 1;
        v.play().catch(() => {});
      }
    } catch (err) {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentMedia, isMuted]);

  // Global interaction handling: unmute on first interaction and keep replaying on interactions
  useEffect(() => {
    const events = ["click", "keydown", "touchstart", "pointerdown"];
    const interactionHandler = () => {
      try {
        const v = videoRef.current;
        if (!v) return;
        // Do NOT unmute on global interactions. Only attempt to resume playback.
        v.play().catch(() => {});
      } catch (e) {}
    };

    events.forEach((ev) => document.addEventListener(ev, interactionHandler, { passive: true }));

    // If the video gets paused unexpectedly (some mobile interactions), try to resume
    const onPause = () => {
      try {
        const v = videoRef.current;
        if (!v) return;
        const active = document.activeElement;
        const tag = active && active.tagName;
        // If user is interacting with an input/textarea/select, don't force-play
        if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || (active && active.isContentEditable)) {
          return;
        }
        setTimeout(() => {
          v.play().catch(() => {});
        }, 150);
      } catch (e) {}
    };

    const v = videoRef.current;
    if (v) v.addEventListener("pause", onPause);

    return () => {
      events.forEach((ev) => document.removeEventListener(ev, interactionHandler));
      if (v) v.removeEventListener("pause", onPause);
    };
  }, []);

  // (Removed capture-phase button handlers to avoid forced interaction flow)

  const toggleMute = () => {
    try {
      const v = videoRef.current;
      const newMuted = !isMuted;
      setIsMuted(newMuted);
      if (v) {
        v.muted = newMuted;
        if (!newMuted) {
          userUnmutedRef.current = true;
          v.volume = 1;
          v.play().catch(() => {});
        }
      }
    } catch (e) {}
  };

  const copyPromo = async (code) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedPromo(code);
      setTimeout(() => setCopiedPromo(""), 2000);
    } catch (e) {
      console.error("Copy failed", e);
    }
  };

  

  const handleOrderSubmit = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!formData.name || !formData.phone || !formData.province || !formData.address) {
      Swal.fire({
        icon: "error",
        title: "خطأ",
        text: "من فضلك أكمل بيانات التوصيل قبل المتابعة",
        confirmButtonColor: "#2f83aa",
      });
      return;
    }
    // Require at least one selected product (from product cards)
    if (!selectedItemsCount || selectedItemsCount === 0) {
      Swal.fire({
        icon: "warning",
        title: "اختر منتج",
        text: "من فضلك اختر على الأقل منتج واحد قبل المتابعة",
        confirmButtonColor: "#2f83aa",
      });
      return;
    }
    // If bundle selected, ensure at least 5 selected items (extras will be charged per-unit)
    if (selectedOffer === 1 && selectedItemsCount < 5) {
      Swal.fire({
        icon: "warning",
        title: "حزمة غير كاملة",
        text: "تحتاج لاختيار 5 منتجات على الأقل للاستفادة من سعر الحزمة",
        confirmButtonColor: "#2f83aa",
      });
      return;
    }
    setShowModal(true);
  };

  const handleConfirmOrder = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    const name = (formData.name || "").trim();
    const phone = (formData.phone || "").trim();
    const province = (formData.province || "").trim();
    const address = (formData.address || "").trim();

    if (!name || !phone) {
      Swal.fire({
        icon: "error",
        title: "خطأ",
        text: "من فضلك أدخل الاسم ورقم الهاتف",
        confirmButtonColor: "#2f83aa",
      });
      return;
    }

    if (!province || !address) {
      Swal.fire({
        icon: "error",
        title: "خطأ",
        text: "من فضلك أدخل المحافظة والعنوان",
        confirmButtonColor: "#2f83aa",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      let cityId = null;
      if (province) {
        cityId = citiesByName.get(province.toLowerCase()) || null;
      }

      // Product item ids can be provided via env for production.
      // Support multiple env names and per-offer item ids (item2, item3).
      const ITEM1 = import.meta.env.VITE_CRM_ITEM_ID || import.meta.env.VITE_PRODUCT_ITEM_ID || import.meta.env.VITE_ITEM_ID || "";
      // Build otherPhones array: include whatsapp number only when `isWhatsapp` is true
      const otherPhonesArr = (formData.isWhatsapp && formData.whatsappNumber && String(formData.whatsappNumber).trim())
        ? [String(formData.whatsappNumber).trim()]
        : [];

      // Determine the actual ordered quantity: prefer the number of selected items if available
      // For bundle offer, the order quantity is the total selected items (bundle + extras)
      const orderedQuantity = selectedItemsCount > 0 ? selectedItemsCount : ((offers[selectedOffer] && offers[selectedOffer].count) || quantity);

        // Use single item id for all offers (ITEM1). ITEM2/ITEM3 removed per requirements.
        const selectedItemId = ITEM1;

      // Defensive check: ensure we have a selected item id before sending the order
      if (!selectedItemId) {
        Swal.fire({
          icon: "error",
          title: "خطأ",
          text: "معرف المنتج مفقود. حاول مرة أخرى لاحقاً.",
          confirmButtonColor: "#2f83aa",
        });
        setIsSubmitting(false);
        return;
      }


      const orderData = {
        name,
        phone,
        otherPhones: otherPhonesArr,
        addresses: [{
          area: "",
          street: address,
          landmark: "",
        }],
        city: cityId || "",
        company: DEFAULT_COMPANY_ID,
        subCategories: DEFAULT_SUBCATS,
        isWhatsapp: !!formData.isWhatsapp,
        items: [
          {
            item: selectedItemId,
            quantity: String(orderedQuantity),
          },
        ],
        shippingFee: String(shippingFee),
        // Apply promo-based discount (handled client-side for preview and sent to backend)
        totalDiscount: String(promoDiscount || 0),
        promoCode: promoCode || "",
        orderOnly: {
          userNote: String((formData.note && String(formData.note).trim()) || `${productDetails.name} - الكمية ${orderedQuantity} - المجموع ${subtotal} جنيه`),
        },
        branch: DEFAULT_BRANCH_ID || "",
      };

      // Debug: log outgoing order payload to help diagnose server errors
      // (remove or disable in production)
      console.debug("Outgoing orderData:", orderData);
      await addOrder(orderData);

      Swal.fire({
        icon: "success",
        title: "تم استلام طلبك!",
        text: "سيتم التواصل معك قريباً",
        confirmButtonColor: "#2f83aa",
      });

      setShowModal(false);
      setFormData({ name: "", phone: "", province: "", city: "", address: "", isWhatsapp: false, whatsappNumber: "", note: "", promoCode: "" });
      setQuantity(1);
    } catch (error) {
      console.error("Order error:", error);
      // Try to surface backend error details when available
      const serverData = error && error.response && error.response.data ? error.response.data : null;
      const serverMessage = serverData && (serverData.message || serverData.error) ? (serverData.message || serverData.error) : null;
      // Log full server response for debugging
      if (serverData) console.debug("Server response data:", serverData);

      Swal.fire({
        icon: "error",
        title: serverMessage ? `خطأ: ${serverMessage}` : "حدث خطأ",
        text: serverMessage ? "تفاصيل مذكورة في الأسفل" : (error.message || "حاول مرة أخرى"),
        footer: serverData ? `<pre style=\"text-align:left;direction:ltr;white-space:pre-wrap;\">${JSON.stringify(serverData)}</pre>` : undefined,
        confirmButtonColor: "#2f83aa",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // --------------------------------------------------------------------------
  // RENDER
  // --------------------------------------------------------------------------

  return (
    <div
      dir="rtl"
      className="min-h-svh bg-gradient-to-br from-blue-50 via-white to-cyan-50 text-neutral-900 lg:pb-15"
    >
      {/* ================================================================
          HEADER - Sticky navigation bar with logo
          ================================================================ */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-lg border-b border-[#2f83aa] shadow-sm">
        <div className="mx-auto max-w-6xl px-4 py-3 relative">
   
          <div className="flex items-center justify-center">
            <div className="w-32 h-18 flex items-center justify-center p-1">
              <img src={logoImg} alt="ستوديو تيينز" className="w-full h-full object-contain" />
            </div>
          </div>

          <div className="absolute right-4 top-1/2 -translate-y-1/2 hidden md:flex items-center leading-tight text-right">
            <div>
              <div className="font-bold text-lg bg-gradient-to-r from-[#2f83aa] to-[#1a5f7a] bg-clip-text text-transparent">
                ستوديو تيينز
              </div>
              <div className="text-xs text-[#2f83aa]">منتجات وعروض مخصصة للمراهقين</div>
            </div>
          </div>
        </div>
      </header>

      {/* ================================================================
          MAIN CONTENT
          ================================================================ */}
      <main className="mx-auto max-w-6xl px-4 py-6 grid grid-cols-1 lg:grid-cols-2 gap-8">
       
        {/* ----------------------------------------
            GALLERY SECTION
            ---------------------------------------- */}
        <section className="space-y-4">
          {/* Main Media Display */}
          
          <div className="relative overflow-hidden rounded-xl border-2 border-[#2f83aa] bg-black shadow-lg">
            {galleryMedia[currentMedia].type === "video" ? (
              <>
                <video
                  ref={videoRef}
                  src={galleryMedia[currentMedia].src}
                  className="w-full h-auto"
                  playsInline
                  autoPlay
                  loop
                  muted={isMuted}
                />

                <button
                  type="button"
                  onClick={toggleMute}
                  aria-pressed={!isMuted}
                  aria-label={isMuted ? "تشغيل الصوت" : "كتم الصوت"}
                  className="absolute top-3 right-3 z-20 bg-white/80 text-xs px-3 py-1 rounded-md shadow hover:bg-white/95 transition"
                >
                  {isMuted ? "🔈 تشغيل" : "🔇 كتم"}
                </button>
              </>
            ) : (
              <img
                src={galleryMedia[currentMedia].src}
                alt="علب التلاجة"
                className="w-full h-auto object-cover"
              />
            )}
          </div>

          {/* Thumbnail Gallery */}
          <div className="grid grid-cols-5 gap-2">
            {galleryMedia.map((media, index) => (
              <div
                key={index}
                className={`relative overflow-hidden rounded-lg border-2 transition-all cursor-pointer ${
                  currentMedia === index
                    ? "border-[#2f83aa] ring-2 ring-[#2f83aa] ring-offset-2 scale-105"
                    : "border-gray-300 hover:border-[#2f83aa]"
                }`}
              >
                <button
                  type="button"
                  onClick={() => handleMediaClick(index)}
                  className="w-full h-full"
                >
                  <img
                    src={media.type === "video" ? (media.thumbnail || media.src) : media.src}
                    alt={`صورة ${index + 1}`}
                    className="w-full h-16 object-cover"
                  />
                </button>
              </div>
            ))}
          </div>

          

        </section>

        {/* ----------------------------------------
            PRODUCT DETAILS SECTION
            ---------------------------------------- */}
        <section className="space-y-5">
         
          {/* Product Pieces */}
          <div className="bg-blue-50 rounded-xl p-4 border-2 border-[#2f83aa]/30">
            <h2 className="font-bold text-lg mb-3 text-[#2f83aa]">
              عدد القطع بالتفصيل:
            </h2>
            <ul className="space-y-2 text-sm text-neutral-700">
              {productDetails.pieces.map((piece, index) => (
                <li key={index} className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-[#2f83aa] mt-0.5 flex-shrink-0" />
                  <span>{piece}</span>
                </li>
              ))}
            </ul>
          </div>

        

          {/* Features */}
          <div className="bg-cyan-50 rounded-xl p-4 border-2 border-cyan-200">
            <h2 className="font-bold text-lg mb-3 text-[#2f83aa]">
              مميزات المنتج:
            </h2>
            <ul className="space-y-2 text-sm text-neutral-700">
              {productDetails.features.map((feature, index) => (
                <li key={index} className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </div>
 {/* Product Title */}
          <div className="space-y-3">
            <h1 className="text-3xl font-extrabold text-[#2f83aa]">
              {productDetails.name}
            </h1>
            <p className="text-lg text-neutral-700">
              {productDetails.description}
            </p>
              <div className="mt-2 flex items-center gap-3 text-sm">
              <div className="font-semibold">المنتجات المختارة: <span className="text-[#2f83aa]">{selectedItemsCount || 0}</span></div>
              <div className="text-neutral-600">سعر لكل منتج: <span className="font-semibold">{perUnitPrice} جنيه</span></div>
              <div className="text-neutral-700">المجموع الحالي: <span className="font-bold text-[#2f83aa]">{subtotal} جنيه</span></div>
            </div>
          </div>

           {/* Flavor selection cards */}
          <div className="mt-4">
            <h3 className="font-bold text-lg mb-3 text-[#2f83aa]">اختر النكهة/النكهات</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {flavors.map((f) => (
                <ProductCard
                  key={f.id}
                  id={f.id}
                  title={f.name}
                  price={f.price}
                  image={f.image}
                  selected={Boolean(selectedItems[f.id])}
                  disabled={false}
                  quantity={selectedItems[f.id] || 0}
                  onToggle={toggleItem}
                  onInc={(id) => changeItemQuantity(id, 1)}
                  onDec={(id) => changeItemQuantity(id, -1)}
                />
              ))}
            </div>
          </div>

          {/* Offer Cards - Desktop Only */}
          <div className="mt-2 w-full">
            <label className="text-sm font-semibold text-neutral-700">العروض:</label>
            <div className="mt-2 w-full grid grid-cols-3 gap-3 py-2">
              {offers.map((o, idx) => {
                const active = selectedOffer === idx;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      // Allow selecting bundle; price calculation will charge bundle for first 5
                      // and add per-unit price for any extras. Quantity state follows selected items.
                      setSelectedOffer(idx);
                      setQuantity(Math.max(1, selectedItemsCount || o.count));
                    }}
                    aria-pressed={active}
                    className={
                      "flex flex-col items-center w-full px-3 py-3 rounded-xl text-sm text-center transition-all duration-300 transform hover:scale-105 " +
                      (active
                        ? "bg-gradient-to-br from-[#2f83aa] to-[#1a5f7a] text-white shadow-lg ring-2 ring-[#7fc0d6] ring-offset-2"
                        : "bg-white text-neutral-700 border-2 border-cyan-100 hover:border-[#2f83aa] hover:bg-cyan-50 shadow-md")
                    }
                  >
                    <span className="font-bold text-base">{o.count === 5 ? '🎉 باقة 5' : '🖼️ منتج'}</span>
                    <span className={"text-xs " + (active ? "text-cyan-100" : "text-neutral-500")}> 
                      {o.count} {o.count === 5 ? 'منتجات —' : 'x'} {o.count === 5 ? `${o.price} جنيه` : `${o.price} جنيه لكل منتج`}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
           {/* Contact Info */}
            {/* Benefits Row: four icons with short Arabic labels */}
            <div className="mt-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center items-center">
                <div className="flex flex-col items-center gap-2 p-3 bg-white/40 rounded-lg">
                  <Truck className="w-8 h-8 text-[#2f83aa]" />
                  <div className="text-sm font-semibold text-neutral-800">التوصيل لحد باب البيت</div>
                </div>

                <div className="flex flex-col items-center gap-2 p-3 bg-white/40 rounded-lg">
                  <DollarSign className="w-8 h-8 text-[#2f83aa]" />
                  <div className="text-sm font-semibold text-neutral-800">الدفع عند الاستلام</div>
                </div>

                <div className="flex flex-col items-center gap-2 p-3 bg-white/40 rounded-lg">
                  <Headphones className="w-8 h-8 text-[#2f83aa]" />
                  <div className="text-sm font-semibold text-neutral-800">في خدمتك دائماً</div>
                </div>

                <div className="flex flex-col items-center gap-2 p-3 bg-white/40 rounded-lg">
                  <Award className="w-8 h-8 text-[#2f83aa]" />
                  <div className="text-sm font-semibold text-neutral-800">ضمان وجودة عالية</div>
                </div>
              </div>
            </div>
       
          {/* Order Now Button removed from here; moved below the form */}
          {/* Delivery Form (moved to right column) */}
          <form onSubmit={handleOrderSubmit} className="mt-6 space-y-3">
            <h3 className="text-lg font-bold text-[#2f83aa]">بيانات التوصيل</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-neutral-700 mb-1">الاسم</label>
                <input
                  id="name"
                  required
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  type="text"
                  placeholder="اكتب اسمك الكامل"
                  className="w-full rounded-lg border border-neutral-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#2f83aa]"
                />
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-neutral-700 mb-1">رقم الهاتف</label>
                <input
                  id="phone"
                  required
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  type="tel"
                  placeholder="01XXXXXXXXX"
                  pattern="01[0125][0-9]{8}"
                  className="w-full dir-ltr rounded-lg border border-neutral-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#2f83aa]"
                />
              </div>
            </div>

            <div className="mt-3 flex items-center gap-3">
              <input
                id="isWhatsapp"
                name="isWhatsapp"
                checked={formData.isWhatsapp}
                onChange={handleInputChange}
                type="checkbox"
                className="w-4 h-4 rounded"
              />
              <label htmlFor="isWhatsapp" className="text-sm font-medium text-neutral-700">أريد إضافة رقم واتساب (اختياري)</label>
            </div>

            {formData.isWhatsapp && (
              <div className="mt-3">
                <label htmlFor="whatsappNumber" className="block text-sm font-medium text-neutral-700 mb-1">رقم واتساب </label>
                <input
                  id="whatsappNumber"
                  name="whatsappNumber"
                  value={formData.whatsappNumber}
                  onChange={handleInputChange}
                  type="tel"
                  placeholder="01XXXXXXXXX"
                  pattern="01[0125][0-9]{8}"
                  className="w-full dir-ltr rounded-lg border border-neutral-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#2f83aa]"
                />
              </div>
            )}

            

            <div className="mt-3">
              <label htmlFor="province" className="block text-sm font-medium text-neutral-700 mb-1">المحافظة</label>
              <select
                id="province"
                required
                name="province"
                value={formData.province}
                onChange={handleInputChange}
                className="w-full rounded-lg border border-neutral-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#2f83aa]"
              >
                <option value="">-- اختر المحافظة --</option>
                {(citiesData || []).map((c) => (
                  <option key={c._id} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="mt-3">
              <label htmlFor="city" className="block text-sm font-medium text-neutral-700 mb-1">المدينة</label>
              <input
                id="city"
                name="city"
                value={formData.city}
                onChange={handleInputChange}
                type="text"
                placeholder="المدينة"
                className="w-full rounded-lg border border-neutral-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#2f83aa]"
              />
            </div>

            <div className="mt-3">
              <label htmlFor="address" className="block text-sm font-medium text-neutral-700 mb-1">العنوان</label>
              <input
                id="address"
                required
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                type="text"
                placeholder="المدينة، الشارع، أقرب علامة مميزة"
                className="w-full rounded-lg border border-neutral-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#2f83aa]"
              />
            </div>

            <div className="mt-3">
              <label htmlFor="note" className="block text-sm font-medium text-neutral-700 mb-1">ملاحظات</label>
              <textarea
                id="note"
                name="note"
                value={formData.note}
                onChange={handleInputChange}
                placeholder="أي تفاصيل إضافية للطلب"
                className="w-full rounded-lg border border-neutral-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#2f83aa] mt-1"
                rows={3}
              />
            </div>

            <div className="mt-3">
              <label htmlFor="promoCode" className="block text-sm font-medium text-neutral-700 mb-1">كود العرض (اختياري)</label>
              <div className="flex gap-2">
                <input
                  id="promoCode"
                  name="promoCode"
                  value={formData.promoCode}
                  onChange={handleInputChange}
                  type="text"
                  placeholder="اكتب كود العرض إن وجد"
                  className="w-full rounded-lg border border-neutral-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#2f83aa]"
                />
                <button type="button" onClick={() => { setFormData(s => ({ ...s, promoCode: '' })); setCopiedPromo(''); }} className="px-3 py-2 bg-white border rounded-lg">مسح</button>
              </div>
              {selectedOffer === 1 ? (
                <p className="text-sm text-red-600 mt-2">ملاحظة: لا يمكن استخدام أكواد الخصم عند اختيار باقة 5.</p>
              ) : (promoCode.toLowerCase() === 'shower-offer' && subtotal < 270 && (
                <p className="text-sm text-red-600 mt-2">ملاحظة: لا يمكن تطبيق كود العرض "shower-offer" إلا عند وجود مشتريات بقيمة 270 جنيه أو أكثر.</p>
              ))}
            </div>

          

            <p className="text-sm text-neutral-600">املأ البيانات ثم اضغط "اطلب الآن" للتأكيد.</p>

            <div className="pt-4">
              <button
                type="submit"
                className="w-full px-6 py-4 rounded-xl bg-gradient-to-r from-[#2f83aa] to-[#1a5f7a] text-white font-bold text-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 flex items-center justify-center gap-2"
              >
                <ShoppingBag className="w-6 h-6" />
                اطلب الآن
              </button>
            </div>
          </form>

          
        </section>

          
      </main>

      {/* ================================================================
          CONFIRMATION MODAL
          ================================================================ */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-[#2f83aa] to-[#1a5f7a] text-white p-6 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  <ShoppingBag className="w-6 h-6" />
                  تأكيد الطلب
                </h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-2 hover:bg-white/20 rounded-full transition-colors"
                  disabled={isSubmitting}
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-4">
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <h3 className="font-bold text-lg mb-3 text-[#2f83aa]">
                  تفاصيل الطلب
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-neutral-700">المنتج:</span>
                    <span className="font-semibold text-neutral-900">
                      {productDetails.name}
                    </span>
                  </div>
                        <div className="flex flex-col gap-2">
                          <div className="flex justify-between">
                            <span className="text-neutral-700">عدد المنتجات المختارة:</span>
                            <span className="font-semibold text-neutral-900">{selectedItemsCount || 0} منتج</span>
                          </div>
                          {selectedItemsCount > 0 && (
                            <div className="flex flex-col gap-2 mt-1">
                              {Object.entries(selectedItems).map(([id, qty]) => {
                                const flavor = flavors.find((f) => f.id === id) || { name: id, image: null };
                                return (
                                  <div key={id} className="flex items-center gap-2">
                                    {flavor.image && (
                                      <img src={flavor.image} alt={flavor.name} className="w-12 h-12 object-cover rounded-md border" />
                                    )}
                                    <div>
                                      <div className="font-semibold">{flavor.name}</div>
                                      <div className="text-xs text-neutral-500">{qty} × {perUnitPrice} جنيه</div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                </div>
              </div>

              {/* Price Summary */}
              <div className="bg-neutral-50 rounded-lg p-4 border border-neutral-200">
                <h3 className="font-bold text-lg mb-3">الملخص المالي</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-neutral-700">سعر المنتج:</span>
                    <span className="font-semibold">{subtotal} جنيه</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-700">سعر التوصيل:</span>
                    <span className="font-semibold">{deliveryLabel}</span>
                  </div>
                  {promoDiscount > 0 && (
                    <div className="flex justify-between">
                      <span className="text-neutral-700">قيمة الخصم:</span>
                      <span className="font-semibold">-{promoDiscount} جنيه</span>
                    </div>
                  )}
                  {promoCode && (
                    <div className="flex justify-between text-sm text-neutral-600">
                      <span>تم إدخال الكود:</span>
                      <span className="font-semibold">{promoCode}</span>
                    </div>
                  )}
                  {promoCode && selectedOffer === 1 && (
                    <div className="text-sm text-red-600 mt-2">ملاحظة: الكود غير قابل للتطبيق على باقة 5.</div>
                  )}
                  <div className="flex justify-between border-t border-neutral-300 pt-2 mt-2">
                    <span className="font-bold text-lg">الإجمالي:</span>
                    <span className="font-bold text-xl text-[#2f83aa]">
                      {grandTotal} جنيه
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer - Confirmation only */}
            <div className="p-6 bg-neutral-50 rounded-b-2xl space-y-3">
              <h3 className="font-bold text-lg text-[#2f83aa]">بيانات التوصيل</h3>
              <div className="text-sm space-y-1">
                <div className="flex justify-between">
                  <span className="text-neutral-700">الاسم:</span>
                  <span className="font-semibold">{formData.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-700">الهاتف:</span>
                  <span className="font-semibold">{formData.phone}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-700">المحافظة:</span>
                  <span className="font-semibold">{formData.province}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-700">العنوان:</span>
                  <span className="font-semibold">{formData.address}</span>
                </div>
              </div>

              <div className="flex gap-3 mt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-6 py-3 rounded-xl bg-white border-2 border-neutral-300 text-neutral-700 font-bold hover:bg-neutral-100 transition-colors"
                  disabled={isSubmitting}
                >
                  تعديل
                </button>
                <button
                  type="button"
                  onClick={() => handleConfirmOrder()}
                  disabled={isSubmitting}
                  className="flex-1 px-6 py-3 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin" />
                      جاري الإرسال...
                    </>
                  ) : (
                    <>
                      <Check className="w-5 h-5" />
                      تأكيد نهائي
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================================================================
          STICKY BOTTOM BAR - Mobile Only with Quantity
          ================================================================ */}
      <div className="fixed inset-x-0 bottom-0 z-30">
        <div className="w-full bg-white border-t-2 border-[#2f83aa] shadow-2xl">
          <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-center gap-4">
            <button
              onClick={handleOrderSubmit}
              className="w-full px-6 py-3 rounded-full bg-gradient-to-r from-[#2f83aa] to-[#1a5f7a] text-white font-bold text-base shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 flex items-center justify-center gap-2 lg:w-44 lg:px-4 lg:py-2 lg:rounded-md lg:text-sm"
            >
              <ShoppingBag className="w-5 h-5 lg:w-4 lg:h-4" />
              اطلب الآن
            </button>
          </div>
        </div>
      </div>

      {/* ================================================================
          FOOTER
          ================================================================ */}
      <footer className="w-full bg-gradient-to-br from-[#2f83aa] via-[#1a5f7a] to-neutral-800 mt-20 text-white pb-20 lg:pb-0">
        <div className="mx-auto max-w-6xl px-6 py-12">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Brand Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                
                <div>
                  <h3 className="text-2xl font-bold">
                    Shawar Cornflakes
                  </h3>
                  <p className="text-xs text-cyan-300">كورن فليكس</p>
                </div>
              </div>
              <p className="text-sm text-neutral-300 leading-relaxed">
                نظمي تلاجتك بسهولة وخلي كل حاجة في مكانها. 
                منتجات بلاستيكية عالية الجودة وآمنة على الطعام.
              </p>
            </div>

            
          </div>
        </div>
        {/* Bottom Bar */}
        <div className="border-t border-white/10 bg-black/30">
          <div className="mx-auto max-w-6xl px-6 py-4 text-center">
            <span className="text-sm text-neutral-400">
              Created by <a href="https://www.sabergroup-eg.com" target="_blank" rel="noopener noreferrer" className="text-cyan-200 hover:underline">SABERGROUPSTUDIOS</a> © </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
