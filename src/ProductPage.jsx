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
import logoImg from "./assets/logo.jpeg";
import photo1 from "./assets/1.png";
import photo2 from "./assets/2.png";
import photo3 from "./assets/3.png";
import photo4 from "./assets/4.png";
import photo5 from "./assets/5.png";
import photo1t from "./assets/01.jpg.jpeg";
import photo2t from "./assets/02.jpg.jpeg";
import photo3t from "./assets/03.jpg.jpeg";
import photo4t from "./assets/04.jpg.jpeg";
import photo5t from "./assets/05.jpg.jpeg";
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

  // Resolved defaults with safe fallbacks for local/dev when env vars are not provided
  const RES_COMPANY_ID = DEFAULT_COMPANY_ID || "697253732fd976608d1de0e6";
  const RES_SUBCATS = (DEFAULT_SUBCATS && DEFAULT_SUBCATS[0]) ? DEFAULT_SUBCATS : ["697253bd2fd976608d1de42f"];
  const RES_BRANCH_ID = DEFAULT_BRANCH_ID || "697253e12fd976608d1de5f3";

  // Product details
  const productDetails = {
    name: "كورن فليكس شاور — ٥ أطعم",
    price: 59,
    description: "كورن فليكس شاور — ٥ نكهات لذيذة ومقرمشة لبدء يومك بأحلى طعم.",
    features: [
      "نكهات طبيعية",
      "مقرمش ولذيذ",
      "عبوة منفصلة لكل طعم للحفاظ على النكهة",
      "متاح التوصيل لكل محافظات الجمهوريه",
      "السعرات الحرارية لكل وجبة 30 جم ( 110 كالوري )",
      "الوزن الاجمالي 200 جرام",
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
    {type: "image", src: photo1t },
    { type: "image", src: photo2 },
        {type: "image", src: photo2t },
    { type: "image", src: photo3 },
        {type: "image", src: photo3t },

    { type: "image", src: photo4 },
        {type: "image", src: photo4t },

    { type: "image", src: photo5 },
        {type: "image", src: photo5t },

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
  const youtubeIframeRef = useRef(null);
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

  const perUnitPrice = productDetails.price || 59;
  // Single unit and 5-piece bundle
  const offers = [
    { count: 1, price: perUnitPrice },
    { count: 5, price: 300 },
  ];

  const [selectedOffer, setSelectedOffer] = useState(0);

  // example flavors based on the available images
  // Read item ids from env variables (support multiple possible names and fallbacks)
  const ITEM1 = import.meta.env.VITE_CRM_ITEM1_ID || import.meta.env.VITE_PRODUCT_ITEM1_ID || import.meta.env.VITE_ITEM1_ID || import.meta.env.VITE_CRM_ITEM_ID || import.meta.env.VITE_PRODUCT_ITEM_ID || import.meta.env.VITE_ITEM_ID || "";
  const ITEM2 = import.meta.env.VITE_CRM_ITEM2_ID || import.meta.env.VITE_PRODUCT_ITEM2_ID || import.meta.env.VITE_ITEM2_ID || "";
  const ITEM3 = import.meta.env.VITE_CRM_ITEM3_ID || import.meta.env.VITE_PRODUCT_ITEM3_ID || import.meta.env.VITE_ITEM3_ID || "";
  const ITEM4 = import.meta.env.VITE_CRM_ITEM4_ID || import.meta.env.VITE_PRODUCT_ITEM4_ID || import.meta.env.VITE_ITEM4_ID || "";
  const ITEM5 = import.meta.env.VITE_CRM_ITEM5_ID || import.meta.env.VITE_PRODUCT_ITEM5_ID || import.meta.env.VITE_ITEM5_ID || "";
  // Fallback IDs (used only if env vars are missing at runtime). Replace with correct IDs if needed.
  const RES_ITEM1 = ITEM1 || "697254ef2fd976608d1deb69";
  const RES_ITEM2 = ITEM2 || "6972550d2fd976608d1deb87";
  const RES_ITEM3 = ITEM3 || "6972552d2fd976608d1deba5";
  const RES_ITEM4 = ITEM4 || "697255b32fd976608d1debc4";
  const RES_ITEM5 = ITEM5 || "697255cb2fd976608d1debe2";

  const flavors = [
    { id: 'flav1', name: 'حلقات الذرة المحمصة بالكاكاو وشوفان', price: perUnitPrice, image: photo1, itemId: RES_ITEM1 },
    { id: 'flav2', name: 'حلقات حبوب الذرة بالشوفان والعسل', price: perUnitPrice, image: photo2, itemId: RES_ITEM2 },
    { id: 'flav3', name: 'حلقات حبوب الذرة بالفاكهة', price: perUnitPrice, image: photo3, itemId: RES_ITEM3 },
    { id: 'flav4', name: 'رقائق الذرة المحمصة بالشوفان', price: perUnitPrice, image: photo4, itemId: RES_ITEM4 },
    { id: 'flav5', name: 'كرات الذرة بالكاكاو والشوفان', price: perUnitPrice, image: photo5, itemId: RES_ITEM5 },
  ];

  // Compute subtotal depending on selected offer or selected items (from ProductCard selections)
  const selectedItemsCount = Object.values(selectedItems || {}).reduce((a, b) => a + (Number(b) || 0), 0);
  // If bundle (5) is selected, base price covers first 5 items; extras are per-unit
  const subtotal = (offers[selectedOffer] && typeof offers[selectedOffer].price === 'number' && offers[selectedOffer].count === 5)
    ? offers[selectedOffer].price + Math.max(0, selectedItemsCount - offers[selectedOffer].count) * perUnitPrice
    : selectedItemsCount * perUnitPrice;

  // Promo code from form
  const promoCode = (formData && formData.promoCode) ? String(formData.promoCode).trim() : "";

  // Shipping promo: entering 'Shower-delivery' (case-insensitive) grants free delivery
  const isDeliveryPromo = promoCode.toLowerCase() === 'shower-delivery';
  const shippingFee = isDeliveryPromo ? 0 : 40;

  // Promo discount: shower-offer gives 90 EGP off for subtotal >= 270
  // Promo discounts are disabled when the 5-item bundle is selected
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

  // Unmute YouTube video on first user interaction
  useEffect(() => {
    const unmuteYouTube = () => {
      if (!userUnmutedRef.current && youtubeIframeRef.current) {
        userUnmutedRef.current = true;
        try {
          // Send unmute command to YouTube iframe
          youtubeIframeRef.current.contentWindow.postMessage(
            '{"event":"command","func":"unMute","args":""}',
            '*'
          );
          // Also set volume to maximum
          setTimeout(() => {
            youtubeIframeRef.current.contentWindow.postMessage(
              '{"event":"command","func":"setVolume","args":[100]}',
              '*'
            );
          }, 100);
        } catch (e) {
          console.error('Failed to unmute YouTube video:', e);
        }
      }
    };

    const events = ["click", "touchstart", "pointerdown"];
    events.forEach((ev) => document.addEventListener(ev, unmuteYouTube, { once: true, passive: true }));

    return () => {
      events.forEach((ev) => document.removeEventListener(ev, unmuteYouTube));
    };
  }, []);

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
        confirmButtonColor: "#472500",
      });
      return;
    }
    // Require at least one selected product (from product cards)
    if (!selectedItemsCount || selectedItemsCount === 0) {
      Swal.fire({
        icon: "warning",
        title: "اختر منتج",
        text: "من فضلك اختر على الأقل منتج واحد قبل المتابعة",
        confirmButtonColor: "#472500",
      });
      return;
    }
    // If bundle selected, ensure at least 5 selected items (extras will be charged per-unit)
    if (selectedOffer === 1 && selectedItemsCount < 5) {
      Swal.fire({
        icon: "warning",
        title: "حزمة غير كاملة",
        text: "تحتاج لاختيار 5 منتجات على الأقل للاستفادة من سعر الحزمة",
        confirmButtonColor: "#472500",
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
        confirmButtonColor: "#472500",
      });
      return;
    }

    if (!province || !address) {
      Swal.fire({
        icon: "error",
        title: "خطأ",
        text: "من فضلك ادخل المحافظة والعنوان",
        confirmButtonColor: "#472500",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      let cityId = null;
      if (province) {
        cityId = citiesByName.get(province.toLowerCase()) || null;
      }

      // Product item ids are read from top-level env constants (ITEM1..ITEM5)
      // Build otherPhones array: include whatsapp number only when `isWhatsapp` is true
      const otherPhonesArr = (formData.isWhatsapp && formData.whatsappNumber && String(formData.whatsappNumber).trim())
        ? [String(formData.whatsappNumber).trim()]
        : [];

      // Determine the actual ordered quantity: prefer the number of selected items if available
      // For bundle offer, the order quantity is the total selected items (bundle + extras)
      const orderedQuantity = selectedItemsCount > 0 ? selectedItemsCount : ((offers[selectedOffer] && offers[selectedOffer].count) || quantity);

        // Build items list from selected flavor selections mapping to env item ids
        // When user selected specific flavors, map each flavor id to its configured item id.
        const flavorIdToItemId = {
          flav1: RES_ITEM1,
          flav2: RES_ITEM2,
          flav3: RES_ITEM3,
          flav4: RES_ITEM4,
          flav5: RES_ITEM5,
        };

        const itemsPayload = [];
        const selectedEntries = Object.entries(selectedItems || {});
        if (selectedEntries.length > 0) {
          selectedEntries.forEach(([fid, qty]) => {
            const itemIdForFlavor = flavorIdToItemId[fid] || ITEM1 || "";
            if (itemIdForFlavor) {
              itemsPayload.push({ item: itemIdForFlavor, quantity: String(qty || 1) });
            }
          });
        }

        // If no individual flavors selected, fall back to single item (bundle or quantity)
        if (itemsPayload.length === 0) {
          if (selectedOffer === 1) {
            // Bundle selected: send the 5 configured item ids as one each
            const bundleIds = [ITEM1, ITEM2, ITEM3, ITEM4, ITEM5];
            // Debug: print resolved env item ids (check browser console)
            try { console.debug('Resolved ITEM ids:', { ITEM1, ITEM2, ITEM3, ITEM4, ITEM5 }); } catch (e) {}
            // Ensure at least one valid item id exists
            const hasAny = bundleIds.some((id) => !!id);
            if (!hasAny) {
              const missing = ['VITE_CRM_ITEM1_ID','VITE_CRM_ITEM2_ID','VITE_CRM_ITEM3_ID','VITE_CRM_ITEM4_ID','VITE_CRM_ITEM5_ID'];
              console.debug('Missing bundle item ids. Resolved values:', bundleIds);
              Swal.fire({ icon: "error", title: "خطأ", html: `معرفات المنتج غير متوفرة.<br/>توقع المتغيرات: ${missing.join(', ')}<br/><br/>القيم الحالية: ${bundleIds.map(v=>v||'<empty>').join(', ')}`, confirmButtonColor: "#472500" });
              setIsSubmitting(false);
              return;
            }
            bundleIds.forEach((id) => {
              const itemId = id || ITEM1 || "";
              if (itemId) itemsPayload.push({ item: itemId, quantity: "1" });
            });

            // If user ordered more than 5 (extras), add the extra quantity to the first item
            if (orderedQuantity > 5) {
              const extraQty = orderedQuantity - 5;
              const extraTarget = ITEM1 || ITEM2 || ITEM3 || ITEM4 || ITEM5 || "";
              if (extraTarget) {
                const found = itemsPayload.find((it) => it.item === extraTarget);
                if (found) {
                  found.quantity = String(Number(found.quantity || 0) + extraQty);
                } else {
                  itemsPayload.push({ item: extraTarget, quantity: String(extraQty) });
                }
              }
            }
          } else {
            const fallbackItem = ITEM1 || "";
            if (!fallbackItem) {
              Swal.fire({ icon: "error", title: "خطأ", text: "معرف المنتج مفقود. حاول مرة أخرى لاحقاً.", confirmButtonColor: "#472500" });
              setIsSubmitting(false);
              return;
            }
            itemsPayload.push({ item: fallbackItem, quantity: String(orderedQuantity) });
          }
        }

      // Determine backend discount: bundle selection gets fixed 150 discount,
      // otherwise use promoDiscount computed locally (promo disabled for bundle)
      const backendDiscount = (selectedOffer === 1) ? 150 : (promoDiscount || 0);

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
        company: RES_COMPANY_ID,
        subCategories: RES_SUBCATS,
        isWhatsapp: !!formData.isWhatsapp,
        items: itemsPayload,
        shippingFee: String(shippingFee),
        // Send discount to backend: bundle gets 150, otherwise promo discount
        totalDiscount: String(backendDiscount || 0),
        orderOnly: {
          userNote: String((formData.note && String(formData.note).trim()) || `${productDetails.name} - الكمية ${orderedQuantity} - المجموع ${subtotal} جنيه`),
        },
        branch: RES_BRANCH_ID || "",
      };

      // Debug: log outgoing order payload to help diagnose server errors
      // (remove or disable in production)
      console.debug("Outgoing orderData:", orderData);
      await addOrder(orderData);

      Swal.fire({
        icon: "success",
        title: "تم استلام طلبك!",
        text: "سيتم التواصل معك قريباً",
        confirmButtonColor: "#472500",
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
        footer: serverData ? `<pre style="text-align:left;direction:ltr;white-space:pre-wrap;">${JSON.stringify(serverData)}</pre>` : undefined,
        confirmButtonColor: "#472500",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const scrollToForm = () => {
    try {
      const el = document.getElementById("orderForm");
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        const firstInput = el.querySelector('input, select, textarea, button');
        if (firstInput) firstInput.focus({ preventScroll: true });
        return;
      }
    } catch (e) {}
    try { handleOrderSubmit(); } catch (e) {}
  };

  // --------------------------------------------------------------------------
  // RENDER
  // --------------------------------------------------------------------------

  return (
    <div
      dir="rtl"
      lang="ar"
      className="arabic min-h-svh bg-gradient-to-br from-blue-50 via-white to-cyan-50 text-neutral-900 lg:pb-15"
    >
      {/* ================================================================
          HEADER - Sticky navigation bar with logo
          ================================================================ */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-lg border-b border-[#472500] shadow-sm">
        <div className="mx-auto max-w-6xl px-4 py-3 relative">
          <div className="flex items-center justify-end">
            <div className="flex items-center gap-3 flex-row-reverse">
              <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-[#472500] bg-white flex-shrink-0">
                <img src={logoImg} alt="Shawar Corn Flakes" className="w-full h-full object-cover block" loading="eager" decoding="async" fetchpriority="high" />
              </div>
              <div className="leading-tight text-left text-sm sm:text-base">
                <div className="font-bold text-base sm:text-lg text-neutral-900">Shawar Corn Flakes</div>
                <div className="text-xs text-[#472500]">كورن فليكس شاور</div>
              </div>
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
          
          <div className="relative overflow-hidden rounded-xl border-2 border-[#472500] bg-black shadow-lg">
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
                loading={currentMedia === 0 ? "eager" : "lazy"}
                decoding="async"
                fetchpriority={currentMedia === 0 ? "high" : "auto"}
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
                    ? "border-[#472500] ring-2 ring-[#472500] ring-offset-2 scale-105"
                    : "border-gray-300 hover:border-[#472500]"
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
                    loading={index < 3 ? "eager" : "lazy"}
                    decoding="async"
                  />
                </button>
              </div>
            ))}
          </div>

          {/* Video (gallery column) - aligned right under thumbnails */}
          <div className="mt-4 flex justify-end">
            <div className="w-full sm:w-80 md:w-96 lg:w-11/12 xl:w-[100%] max-w-screen-lg mx-auto relative overflow-hidden rounded-xl border-4 border-[#472500] shadow-2xl" style={{ paddingTop: '56.25%' }}>
              <iframe
                ref={youtubeIframeRef}
                className="absolute inset-0 w-full h-full"
                src="https://www.youtube.com/embed/sIlyGbcUEkY?rel=0&autoplay=1&mute=1&loop=1&playlist=sIlyGbcUEkY&enablejsapi=1"
                title="Shawar product video"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                allowFullScreen
              />
            </div>
          </div>

        </section>

        {/* ----------------------------------------
            PRODUCT DETAILS SECTION
            ---------------------------------------- */}
        <section className="space-y-5">
         
        

        

          {/* Features */}
          <div className="bg-blue-50 rounded-xl p-4 border-2 border-[#472500]/30">
            <h2 className="font-bold text-lg mb-3 text-[#472500]">
              مواصفات المنتج:
            </h2>
            <ul className="space-y-2 text-sm text-neutral-700">
              {productDetails.features.map((feature, index) => (
                <li key={index} className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-[#472500] mt-0.5 flex-shrink-0" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </div>
 {/* Product Title */}
          <div className="space-y-3">
            <h1 className="text-3xl font-extrabold text-[#472500]">
              {productDetails.name}
            </h1>
            <p className="text-lg text-neutral-700">
              {productDetails.description}
            </p>
            <div className="mt-2 text-sm text-neutral-700 space-y-1">
              <div>{productDetails.specs.calories}</div>
              <div>{productDetails.specs.totalWeight}</div>
            </div>
              <div className="mt-2 flex items-center gap-3 text-sm">
              <div className="font-semibold">المنتجات المختارة: <span className="text-[#472500]">{selectedItemsCount || 0}</span></div>
              <div className="text-neutral-600">سعر لكل منتج: <span className="font-semibold">{perUnitPrice} جنيه</span></div>
              <div className="text-neutral-700">المجموع الحالي: <span className="font-bold text-[#472500]">{subtotal} جنيه</span></div>
            </div>
          </div>

           {/* Flavor selection cards */}
          <div className="mt-4">
            <h3 className="font-bold text-lg mb-3 text-[#472500]">اختر النكهة/النكهات</h3>
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
          {/* <div className="mt-2 w-full">
            <label className="text-sm font-semibold text-neutral-700">العروض:</label>
            <div className="mt-2 w-full flex flex-col gap-3 py-2">
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
                      "flex items-center justify-between w-full px-5 py-4 rounded-2xl text-sm transition-all duration-300 transform hover:scale-105 " +
                      (active
                        ? "bg-gradient-to-br from-[#472500] to-[#472500] text-white shadow-lg ring-2 ring-[#472500] ring-offset-2"
                        : "bg-white text-neutral-700 border border-cyan-100 hover:border-[#472500] hover:bg-cyan-50 shadow-md")
                    }
                  >
                    <div className="text-right">
                      <div className="font-bold text-base">{o.count === 5 ? ' باقة 5' : ' منتج'}</div>
                      <div className={"text-sm " + (active ? "text-cyan-100" : "text-neutral-500")}>
                        {o.count === 5 ? `${o.count} منتجات — ${o.price} جنيه` : `${o.price} جنيه لكل منتج`}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div> */}
           {/* Contact Info */}
            {/* Benefits Row: four icons with short Arabic labels */}
            <div className="mt-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center items-center">
                <div className="flex flex-col items-center gap-2 p-3 bg-white/40 rounded-lg">
                  <Truck className="w-8 h-8 text-[#472500]" />
                  <div className="text-sm font-semibold text-neutral-800">التوصيل لحد باب البيت</div>
                </div>

                <div className="flex flex-col items-center gap-2 p-3 bg-white/40 rounded-lg">
                  <DollarSign className="w-8 h-8 text-[#472500]" />
                  <div className="text-sm font-semibold text-neutral-800">الدفع عند الاستلام</div>
                </div>

                <div className="flex flex-col items-center gap-2 p-3 bg-white/40 rounded-lg">
                  <Headphones className="w-8 h-8 text-[#472500]" />
                  <div className="text-sm font-semibold text-neutral-800">في خدمتك دائماً</div>
                </div>

                <div className="flex flex-col items-center gap-2 p-3 bg-white/40 rounded-lg">
                  <Award className="w-8 h-8 text-[#472500]" />
                  <div className="text-sm font-semibold text-neutral-800">ضمان وجودة عالية</div>
                </div>
              </div>
            </div>
       
          {/* Order Now Button removed from here; moved below the form */}
          {/* Delivery Form (moved to right column) */}
          <form id="orderForm" onSubmit={handleOrderSubmit} className="mt-6 space-y-3">
            <h3 className="text-lg font-bold text-[#472500]">بيانات التوصيل</h3>
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
                  className="w-full rounded-lg border border-neutral-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#472500]"
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
                  className="w-full dir-ltr rounded-lg border border-neutral-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#472500]"
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
                  className="w-full dir-ltr rounded-lg border border-neutral-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#472500]"
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
                className="w-full rounded-lg border border-neutral-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#472500]"
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
                className="w-full rounded-lg border border-neutral-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#472500]"
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
                className="w-full rounded-lg border border-neutral-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#472500]"
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
                className="w-full rounded-lg border border-neutral-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#472500] mt-1"
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
                  className="w-full rounded-lg border border-neutral-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#472500]"
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
                className="w-full px-6 py-4 rounded-xl bg-gradient-to-r from-[#472500] to-[#472500] text-white font-bold text-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 flex items-center justify-center gap-2"
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
            <div className="bg-gradient-to-r from-[#472500] to-[#472500] text-white p-6 rounded-t-2xl">
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
                <h3 className="font-bold text-lg mb-3 text-[#472500]">
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
                                      <img src={flavor.image} alt={flavor.name} className="w-12 h-12 object-cover rounded-md border" loading="lazy" decoding="async" />
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
                    <span className="font-bold text-xl text-[#472500]">
                      {grandTotal} جنيه
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer - Confirmation only */}
            <div className="p-6 bg-neutral-50 rounded-b-2xl space-y-3">
              <h3 className="font-bold text-lg text-[#472500]">بيانات التوصيل</h3>
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
        <div className="w-full bg-white border-t-2 border-[#472500] shadow-2xl">
          <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between gap-4">
            {/* Product Count and Total Amount */}
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2 text-[#472500]">
                <ShoppingBag className="w-4 h-4" />
                <span className="font-bold text-sm">عدد المنتجات: {selectedItemsCount}</span>
              </div>
              <div className="flex items-center gap-2 text-[#472500]">
                <DollarSign className="w-4 h-4" />
                <span className="font-bold text-sm">المبلغ: {subtotal - promoDiscount} جنيه</span>
              </div>
              <div className="flex items-center gap-2 text-[#472500]">
                <Truck className="w-4 h-4" />
                <span className="font-bold text-sm">التوصيل: {deliveryLabel}</span>
              </div>
            </div>
            
            {/* Order Button */}
            <button
              onClick={scrollToForm}
              className="px-6 py-3 rounded-full bg-gradient-to-r from-[#472500] to-[#472500] text-white font-bold text-base shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 flex items-center justify-center gap-2 lg:px-4 lg:py-2 lg:rounded-md lg:text-sm whitespace-nowrap"
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
      <footer className="w-full bg-gradient-to-br from-[#472500] via-[#472500] to-neutral-800 mt-20 text-white pb-20 lg:pb-0">
        <div className="mx-auto max-w-6xl px-6 py-12">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Brand Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div>
                  <h3 className="text-2xl font-bold">
Richie                  </h3>
                  <p className="text-xs text-cyan-50">شاور كورن فليكس من ريتشي </p>
                </div>
              </div>
              <p className="text-sm text-neutral-300 leading-relaxed">
                طعم صباح مليان طاقة — كورنفلكس من شاور، حبوب مقرمشة بنكهات طبيعية ومغذية.
              </p>
            </div>

            
          </div>
        </div>
        {/* Bottom Bar */}
        <div className="border-t border-white/10 bg-black/30">
          <div className="mx-auto max-w-6xl px-6 py-4 text-center">
            <span className="text-sm text-neutral-400">
              Created by <a href="https://www.sabergroup-eg.com" target="_blank" rel="noopener noreferrer" className="text-blue-50 hover:underline">SABERGROUPSTUDIOS</a> © </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
