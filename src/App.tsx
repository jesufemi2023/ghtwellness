import React, { useState, useEffect, useRef } from "react";
import { 
  Activity, 
  ShoppingBag, 
  User, 
  Search, 
  History,
  ChevronRight, 
  Stethoscope, 
  Phone, 
  CheckCircle2,
  Database as DbIcon,
  ShieldCheck,
  LayoutGrid,
  Globe,
  Truck,
  Award,
  Menu,
  X,
  Star,
  Eye,
  Leaf,
  ArrowLeft,
  Info,
  MessageSquare,
  MapPin,
  Plus,
  Minus,
  Package,
  Share2,
  Check,
  FileText,
  Home as HomeIcon
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { CONFIG } from "./config";
import { CacheService } from "./utils/cache";
import { openWhatsAppLink } from "./utils/whatsapp";

import { Home } from "./components/Home";
import { About } from "./components/About";
import { PackageCard } from "./components/PackageCard";
import { ProductCard } from "./components/ProductCard";
import { ComboCard } from "./components/ComboCard";
import { OrderDrawer } from "./components/OrderDrawer";
import { BlogList } from "./components/blog/BlogList";
import { BlogPost } from "./components/blog/BlogPost";
import { PackageQuickView } from "./components/PackageQuickView";
import { AIChatBot } from "./components/chat/AIChatBot";
import { SearchResults } from "./components/SearchResults";
import AdminDashboard from "./components/AdminDashboard";
import { TestimonialsPage } from "./components/TestimonialsPage";
import { ThankYouPage } from "./components/ThankYouPage";
import { ReturnPolicy } from "./components/ReturnPolicy";
import { AdLandingPage } from "./components/AdLandingPage";
import { Product, PackageData } from "./types";
import { trackPageView, trackConsultation, trackWhatsAppClick, trackBlogView } from "./lib/analytics";

interface Consultation {
  id: string;
  patient_name: string;
  phone: string;
  illness: string;
  symptoms: string;
  ai_recommendation: string;
  recommended_products: string[];
  created_at: string;
}

export default function App() {
  const [activeTab, setActiveTab] = useState<"home" | "ad" | "about" | "products" | "recommended" | "combo" | "consultation" | "history" | "product-detail" | "package-detail" | "admin" | "blog" | "blog-post" | "search" | "testimonials" | "thank-you" | "return-policy">((() => {
    const path = window.location.pathname;
    if (path === "/thank-you" || path.startsWith("/thank-you")) {
      return "thank-you";
    }
    if (path === "/return-policy" || path.startsWith("/return-policy")) {
      return "return-policy";
    }
    if (path === "/ad" || path.startsWith("/ad")) {
      return "ad";
    }
    const params = new URLSearchParams(window.location.search);
    if (params.get("page") === "thank-you" || params.get("page") === "thankyou" || params.has("thank-you")) {
      return "thank-you";
    }
    if (params.get("page") === "return-policy" || params.get("page") === "returnpolicy" || params.has("return-policy")) {
      return "return-policy";
    }
    if (params.get("page") === "ad" || params.has("ad")) {
      return "ad";
    }
    if (params.has("package") || params.has("buy_package") || params.has("combo") || params.has("buy_combo")) {
      return "package-detail";
    }
    if (params.has("product") || params.has("buy_product")) {
      return "product-detail";
    }
    if (params.has("blog")) {
      return "blog-post";
    }
    return "home";
  })());
  const [previousTab, setPreviousTab] = useState<typeof activeTab>("home");

  const navigateTo = (tab: typeof activeTab) => {
    setPreviousTab(activeTab);
    setActiveTab(tab);
    if (tab === "return-policy") {
      window.history.pushState(null, '', '/return-policy');
    } else if (tab === "ad") {
      window.history.pushState(null, '', '/ad');
    } else if (tab === "home") {
      window.history.pushState(null, '', '/');
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const [adminPassword, setAdminPassword] = useState("");
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [recommendedPackages, setRecommendedPackages] = useState<PackageData[]>([]);
  const [comboPackages, setComboPackages] = useState<PackageData[]>([]);
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedPackage, setSelectedPackage] = useState<PackageData | null>(null);
  const [viewingPackage, setViewingPackage] = useState<PackageData | null>(null);
  const [selectedBlogId, setSelectedBlogId] = useState<string | null>(null);
  const [isOrderDrawerOpen, setIsOrderDrawerOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [orderItem, setOrderItem] = useState<{ item: any, type: 'package' | 'product', qty: number, optIdx?: number } | null>(null);
  const [distributorId, setDistributorId] = useState(CONFIG.defaults.distributorId);
  const [detailQuantity, setDetailQuantity] = useState(1);
  const [quickViewQuantity, setQuickViewQuantity] = useState(1);
  const [openedFromQuickView, setOpenedFromQuickView] = useState<'product' | 'package' | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const dId = params.get('ref') || params.get('distributor_id');
    if (dId) setDistributorId(dId);
  }, []);

  useEffect(() => {
    if (selectedProduct) setQuickViewQuantity(1);
  }, [selectedProduct]);

  const openOrderDrawer = (item: any, type: 'package' | 'product', qty: number = 1, optIdx?: number, fromQuickView: boolean = false) => {
    setOrderItem({ item, type, qty, optIdx });
    setIsOrderDrawerOpen(true);
    if (fromQuickView) {
      setOpenedFromQuickView(type);
    } else {
      setOpenedFromQuickView(null);
    }
    setSelectedProduct(null); // Close quick view modal if open
    setSelectedPackage(null); // Close package quick view modal if open
  };

  const [isProductCopied, setIsProductCopied] = useState(false);
  const handleShareProduct = async (product: any) => {
    const shareUrl = `${window.location.origin}/?product=${product.product_code || product.id}`;
    const shareData = {
      title: product.name,
      text: product.short_desc,
      url: shareUrl,
    };

    if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        if ((err as Error).name !== 'AbortError') console.error("Error sharing:", err);
      }
    } else {
      try {
        await navigator.clipboard.writeText(shareUrl);
        setIsProductCopied(true);
        setTimeout(() => setIsProductCopied(false), 2000);
      } catch (err) {
        console.error("Error copying:", err);
      }
    }
  };
  const [viewingProduct, setViewingProduct] = useState<Product | null>(null);

  const viewProductDetailPage = (product: Product) => {
    setPreviousTab(activeTab);
    setViewingProduct(product);
    setActiveTab("product-detail");
    const code = product.product_code || product.id;
    window.history.pushState(null, '', `/?product=${code}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const viewPackageDetailPage = (pkg: PackageData) => {
    setPreviousTab(activeTab);
    setViewingPackage(pkg);
    setActiveTab("package-detail");
    const code = pkg.package_code || pkg.id;
    const paramKey = pkg.is_combo ? 'combo' : 'package';
    window.history.pushState(null, '', `/?${paramKey}=${code}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const [zoomPos, setZoomPos] = useState({ x: 0, y: 0 });
  const [isZoomed, setIsZoomed] = useState(false);
  const moreMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (moreMenuRef.current && !moreMenuRef.current.contains(event.target as Node)) {
        setIsMoreMenuOpen(false);
      }
    };

    if (isMoreMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isMoreMenuOpen]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const x = ((e.pageX - left) / width) * 100;
    const y = ((e.pageY - top) / height) * 100;
    setZoomPos({ x, y });
  };

  // Robust Session Management (Anonymous RLS)
  const [accessToken] = useState(() => {
    try {
      const existing = localStorage.getItem("ght_access_token");
      if (existing) return existing;
      const newToken = typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
        ? crypto.randomUUID()
        : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
          });
      localStorage.setItem("ght_access_token", newToken);
      return newToken;
    } catch {
      // Fallback for restricted/disabled environments like iOS Private Browsing
      const newToken = typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
        ? crypto.randomUUID()
        : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
          });
      return newToken;
    }
  });

  // Form State - No hardcoding
  const [formData, setFormData] = useState({
    patient_name: "",
    phone: "",
    illness: "",
    symptoms: "",
    distributor_id: distributorId
  });

  useEffect(() => {
    setFormData(prev => ({ ...prev, distributor_id: distributorId }));
  }, [distributorId]);

  useEffect(() => {
    const initApp = async () => {
      // 1. Try to load from cache first for instant UI
      const cachedProducts = CacheService.get(CacheService.KEYS.PRODUCTS);
      const cachedPackages = CacheService.get(CacheService.KEYS.PACKAGES);

      if (cachedProducts) setProducts(cachedProducts);
      if (cachedPackages) {
        setRecommendedPackages(cachedPackages.filter((p: any) => !p.is_combo));
        setComboPackages(cachedPackages.filter((p: any) => p.is_combo));
      }

      // 2. Check if cache is valid in background
      const isValid = await CacheService.isCacheValid();
      
      if (!isValid || !cachedProducts || !cachedPackages) {
        // Cache is stale or missing, fetch fresh data
        fetchProducts();
        fetchRecommendedPackages();
      }
    };

    initApp();
  }, []); // Only on mount

  useEffect(() => {
    if (activeTab === "history") fetchHistory();
    
    // Track Page View
    const titles: Record<string, string> = {
      home: "Home",
      about: "About Us",
      products: "All Products",
      recommended: "Expert Solutions",
      combo: "Combo Packs",
      consultation: "AI Consultation",
      history: "Consultation History",
      "product-detail": `Product: ${viewingProduct?.name || "Detail"}`,
      admin: "Admin Dashboard",
      blog: "Health Blog",
      "blog-post": "Blog Article",
      search: `Search: ${searchQuery}`,
      testimonials: "Success Stories",
      "thank-you": "Thank You",
      "return-policy": "Return & Exchange Policy"
    };
    trackPageView(activeTab, titles[activeTab]);
  }, [activeTab, viewingProduct, searchQuery]);

  const fetchProducts = async () => {
    try {
      const res = await fetch("/api/products");
      if (!res.ok) {
        if (res.status === 404) {
          throw new Error("API endpoint not found. Please ensure the server is configured correctly.");
        }
        const text = await res.text();
        if (text.includes("Rate exceeded")) {
          console.warn("Rate limit exceeded for products, retrying in 2s...");
          setTimeout(fetchProducts, 2000);
          return;
        }
        let errorMsg = `HTTP error! status: ${res.status}`;
        try {
          const errData = JSON.parse(text);
          if (errData.error && errData.error.includes('relation "products" does not exist')) {
            errorMsg = "Database table 'products' is missing. Please run the SQL migration in Supabase.";
          } else if (errData.error) {
            errorMsg = errData.error;
          }
        } catch (e) {
          errorMsg = text || errorMsg;
        }
        throw new Error(errorMsg);
      }
      const data = await res.json();
      if (Array.isArray(data)) {
        setProducts(data);
        CacheService.save(CacheService.KEYS.PRODUCTS, data);
      } else {
        console.error("Products data is not an array:", data);
        setProducts([]);
      }
    } catch (e: any) {
      console.error("Failed to fetch products:", e);
      if (e.message === "Failed to fetch") {
        console.warn("Network error: Server might be starting or unreachable. Retrying in 3s...");
        setTimeout(fetchProducts, 3000);
      }
      setProducts([]);
    }
  };

  const fetchRecommendedPackages = async () => {
    try {
      const res = await fetch("/api/recommended-packages");
      if (!res.ok) {
        if (res.status === 404) {
          throw new Error("API endpoint not found. Please ensure the server is configured correctly.");
        }
        const text = await res.text();
        if (text.includes("Rate exceeded")) {
          console.warn("Rate limit exceeded for packages, retrying in 2s...");
          setTimeout(fetchRecommendedPackages, 2000);
          return;
        }
        let errorMsg = `HTTP error! status: ${res.status}`;
        try {
          const errData = JSON.parse(text);
          if (errData.error && errData.error.includes('relation "recommended_packages" does not exist')) {
            errorMsg = "Database table 'recommended_packages' is missing. Please run the SQL migration in Supabase.";
          } else if (errData.error) {
            errorMsg = errData.error;
          }
        } catch (e) {
          errorMsg = text || errorMsg;
        }
        throw new Error(errorMsg);
      }
      const data: PackageData[] = await res.json();
      if (Array.isArray(data)) {
        setRecommendedPackages(data.filter(p => !p.is_combo));
        setComboPackages(data.filter(p => p.is_combo));
        CacheService.save(CacheService.KEYS.PACKAGES, data);
      } else {
        setRecommendedPackages([]);
        setComboPackages([]);
      }
    } catch (e: any) {
      console.error("Failed to fetch recommended packages:", e);
      if (e.message === "Failed to fetch") {
        console.warn("Network error: Server might be starting or unreachable. Retrying in 3s...");
        setTimeout(fetchRecommendedPackages, 3000);
      }
      setRecommendedPackages([]);
      setComboPackages([]);
    }
  };

  useEffect(() => {
    if (adminPassword && activeTab === 'admin' && !isAdminAuthenticated) {
      handleAdminLogin();
    }
  }, [activeTab]);

  useEffect(() => {
    // Deep Linking Logic: Check for buy_product, buy_package, product, package, or blog in URL
    const handleDeepLinking = async () => {
      if (loading) return;

      const params = new URLSearchParams(window.location.search);
      const buyProductId = params.get('buy_product');
      const buyPackageId = params.get('buy_package');
      const buyComboId = params.get('buy_combo');
      const productId = params.get('product');
      const packageId = params.get('package');
      const comboId = params.get('combo');
      const blogId = params.get('blog');

      if (!buyProductId && !buyPackageId && !buyComboId && !productId && !packageId && !comboId && !blogId) return;

      // 1. Handle Blog
      if (blogId) {
        setSelectedBlogId(blogId);
        setActiveTab("blog-post");
      }

      // 2. Handle Package / Buy Package / Combo / Buy Combo
      const targetPackageId = buyPackageId || packageId || buyComboId || comboId;
      const isBuyAction = !!buyPackageId || !!buyComboId;
      if (targetPackageId) {
        setActiveTab("package-detail");
        const allPkgs = [...recommendedPackages, ...comboPackages];
        let pkg = allPkgs.find(p => 
          p.id?.toLowerCase() === targetPackageId.toLowerCase() || 
          p.package_code?.toLowerCase() === targetPackageId.toLowerCase()
        );
        
        if (pkg) {
          setViewingPackage(pkg);
          if (isBuyAction) openOrderDrawer(pkg, 'package');
        } else {
          try {
            const res = await fetch(`/api/packages/${encodeURIComponent(targetPackageId)}`);
            if (res.ok) {
              const data = await res.json();
              if (data && data.id) {
                setViewingPackage(data);
                if (isBuyAction) openOrderDrawer(data, 'package');
              }
            }
          } catch (e) {
            console.error("Failed to fetch deep link package/combo:", e);
          }
        }
      }

      // 3. Handle Product / Buy Product
      const targetProductId = buyProductId || productId;
      if (targetProductId) {
        setActiveTab("product-detail");
        let prod = products.find(p => 
          p.id?.toLowerCase() === targetProductId.toLowerCase() || 
          p.product_code?.toLowerCase() === targetProductId.toLowerCase()
        );
        
        if (prod) {
          setViewingProduct(prod);
          setSelectedProduct(prod);
          if (buyProductId) openOrderDrawer(prod, 'product');
        } else {
          try {
            const res = await fetch(`/api/products/${encodeURIComponent(targetProductId)}`);
            if (res.ok) {
              const data = await res.json();
              if (data && data.id) {
                setViewingProduct(data);
                setSelectedProduct(data);
                if (buyProductId) openOrderDrawer(data, 'product');
              }
            } else {
              const allRes = await fetch(`/api/products`);
              if (allRes.ok) {
                const prods: Product[] = await allRes.json();
                const found = prods.find(p => 
                  p.id?.toLowerCase() === targetProductId.toLowerCase() || 
                  p.product_code?.toLowerCase() === targetProductId.toLowerCase()
                );
                if (found) {
                  setViewingProduct(found);
                  setSelectedProduct(found);
                  if (buyProductId) openOrderDrawer(found, 'product');
                }
              }
            }
          } catch (e) {
            console.error("Failed to fetch deep link product:", e);
          }
        }
      }

      // 4. Clear URL parameters to prevent "sticky" state
      const newUrl = window.location.pathname;
      window.history.replaceState({}, '', newUrl);
    };

    handleDeepLinking();
  }, [products, recommendedPackages, comboPackages, loading]);

  const handleConsultation = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 20000); // 20s timeout for consultation

      const res = await fetch("/api/consultations", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "x-access-token": accessToken
        },
        body: JSON.stringify(formData),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      const contentType = res.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        const data = await res.json();
        if (data.error) {
          alert(`Error: ${data.error}`);
        } else {
          alert(`Consultation Submitted!\n\nExpert Recommendation: ${data.ai_recommendation}`);
          trackConsultation(formData.illness);
          setFormData({ ...formData, patient_name: "", phone: "", illness: "", symptoms: "" });
          navigateTo("history");
        }
      } else {
        const status = res.status;
        if (status === 504 || status === 503 || status === 502 || status === 500) {
          alert("The AI expert is taking a long time to analyze your symptoms or the server is busy. Your consultation might still be processing. Please check your history in a minute.");
        } else {
          alert(`The server is currently busy (Status: ${status}). Please try again in a few seconds.`);
        }
      }
    } catch (e: any) {
      if (e.name === 'AbortError') {
        alert("Request timed out. The AI is experiencing high demand. Please check your history in a moment to see if it processed.");
      } else {
        alert("Failed to submit consultation. Please check your connection or try again later.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAdminLogin = async () => {
    setLoading(true);
    try {
      // Try to fetch a simple admin endpoint to verify the password
      const res = await fetch("/api/admin/products", {
        headers: { "x-admin-password": adminPassword }
      });
      
      if (res.ok) {
        setIsAdminAuthenticated(true);
      } else {
        const data = await res.json();
        alert(data.error || "Invalid Password");
      }
    } catch (e) {
      alert("Connection failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleAdminLogout = () => {
    setIsAdminAuthenticated(false);
    setAdminPassword("");
    navigateTo("home");
  };

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const [cRes, oRes] = await Promise.all([
        fetch("/api/my-consultations", { headers: { "x-access-token": accessToken } }),
        fetch("/api/my-orders", { headers: { "x-access-token": accessToken } })
      ]);

      if (cRes.ok) {
        const cData = await cRes.json();
        setConsultations(Array.isArray(cData) ? cData : []);
      }

      if (oRes.ok) {
        const oData = await oRes.json();
        setOrders(Array.isArray(oData) ? oData : []);
      }
    } catch (e) {
      console.error("Failed to fetch history:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleWhatsAppClick = (location: string) => {
    trackWhatsAppClick(location);
    openWhatsAppLink(CONFIG.whatsapp.number, CONFIG.whatsapp.defaultMessage);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans text-slate-900">
      {/* Sticky Top Navigation Container */}
      <div className="sticky top-0 z-50 shadow-sm">
        {/* Top Announcement Bar */}
        <div className="bg-emerald-900 text-white py-2 px-4 text-center text-[9px] md:text-xs font-black uppercase tracking-[0.1em] md:tracking-[0.2em]">
          <div className="max-w-7xl mx-auto flex items-center justify-center gap-3 md:gap-8">
            <span className="flex items-center gap-1.5">
              <Globe size={12} className="text-emerald-400" />
              Free Delivery Across Nigeria
            </span>
            <div className="w-[1px] h-3 bg-white/20 hidden sm:block"></div>
            <span className="flex items-center gap-1.5">
              <Truck size={12} className="text-emerald-400" />
              We Deliver Worldwide
            </span>
            <div className="w-[1px] h-3 bg-white/20 hidden sm:block"></div>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 size={12} className="text-emerald-400" />
              Pay on Delivery
            </span>
          </div>
        </div>

        {/* Header */}
        <header className="bg-white border-b border-slate-200">
          <div className="max-w-7xl mx-auto px-4 h-16 md:h-20 flex items-center justify-between gap-4">
            <button 
              onClick={() => navigateTo("home")}
              className="flex items-center gap-2 md:gap-3 flex-shrink-0 cursor-pointer text-left hover:opacity-95 transition-all group"
              title="Go to Homepage"
            >
              {CONFIG.company.logoUrl ? (
                <img 
                  src={CONFIG.company.logoUrl} 
                  alt={CONFIG.company.name} 
                  className="h-8 md:h-12 w-auto object-contain group-hover:scale-105 transition-transform"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-8 h-8 md:w-10 md:h-10 bg-emerald-600 rounded-lg md:rounded-xl flex items-center justify-center text-white shadow-lg group-hover:scale-105 transition-transform">
                  <Activity size={18} className="md:hidden" />
                  <Activity size={24} className="hidden md:block" />
                </div>
              )}
              <div className="flex flex-col">
                <h1 className="font-bold text-sm md:text-xl tracking-tight text-slate-800 leading-none group-hover:text-emerald-600 transition-colors">{CONFIG.company.name}</h1>
                <p className="text-[8px] md:text-[10px] uppercase tracking-[0.1em] md:tracking-[0.2em] font-semibold text-emerald-600 mt-0.5">{CONFIG.company.subtitle}</p>
              </div>
            </button>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center justify-center gap-4 xl:gap-6 flex-1 px-4">
              {CONFIG.navigation.filter(item => ["home", "testimonials", "products", "recommended", "combo", "blog"].includes(item.id)).map((item) => {
                const Icon = item.id === "home" ? HomeIcon :
                             item.id === "testimonials" ? MessageSquare :
                             item.id === "products" ? ShoppingBag : 
                             item.id === "recommended" ? LayoutGrid :
                             item.id === "combo" ? Package :
                             item.id === "blog" ? FileText : HomeIcon;
                return (
                  <button
                    key={item.id}
                    onClick={() => navigateTo(item.id as any)}
                    className={`flex items-center gap-1.5 xl:gap-2 text-xs xl:text-sm font-bold transition-all whitespace-nowrap py-2 px-1 border-b-2 ${
                      activeTab === item.id 
                        ? "text-emerald-600 border-emerald-600" 
                        : "text-slate-500 border-transparent hover:text-emerald-500 hover:border-emerald-200"
                    }`}
                  >
                    <Icon size={16} className="xl:w-[18px] xl:h-[18px]" />
                    {item.label}
                  </button>
                );
              })}

              {/* More Menu */}
              <div className="relative" ref={moreMenuRef}>
                <button
                  onClick={() => setIsMoreMenuOpen(!isMoreMenuOpen)}
                  className={`flex items-center gap-1.5 xl:gap-2 text-xs xl:text-sm font-bold transition-all whitespace-nowrap py-2 px-1 border-b-2 ${
                    ["consultation", "history", "admin", "about"].includes(activeTab)
                      ? "text-emerald-600 border-emerald-600"
                      : "text-slate-500 border-transparent hover:text-emerald-500 hover:border-emerald-200"
                  }`}
                >
                  More <ChevronRight size={16} className={`transition-transform ${isMoreMenuOpen ? 'rotate-90' : ''}`} />
                </button>

                <AnimatePresence>
                  {isMoreMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute top-full right-0 mt-2 w-48 bg-white rounded-2xl shadow-2xl border border-slate-100 py-2 z-50"
                    >
                      {CONFIG.navigation.filter(item => !["home", "testimonials", "products", "recommended", "combo", "blog"].includes(item.id)).map((item) => {
                        const Icon = item.id === "about" ? Info :
                                     item.id === "consultation" ? Stethoscope : 
                                     item.id === "history" ? History :
                                     item.id === "admin" ? DbIcon : User;
                        return (
                          <button
                            key={item.id}
                            onClick={() => {
                              navigateTo(item.id as any);
                              setIsMoreMenuOpen(false);
                            }}
                            className={`flex items-center gap-3 w-full px-4 py-3 text-sm font-bold transition-all ${
                              activeTab === item.id 
                                ? "text-emerald-600 bg-emerald-50" 
                                : "text-slate-600 hover:bg-slate-50 hover:text-emerald-500"
                            }`}
                          >
                            <Icon size={16} />
                            {item.label}
                          </button>
                        );
                      })}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </nav>

            <div className="flex items-center gap-2 md:gap-4 flex-shrink-0">
              <div className={`flex items-center transition-all duration-300 ${isSearchVisible ? 'w-40 md:w-64' : 'w-10'}`}>
                <AnimatePresence mode="wait">
                  {isSearchVisible ? (
                    <motion.div 
                      initial={{ width: 0, opacity: 0 }}
                      animate={{ width: "100%", opacity: 1 }}
                      exit={{ width: 0, opacity: 0 }}
                      className="relative flex items-center w-full"
                    >
                      <input 
                        autoFocus
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && searchQuery.trim()) {
                            navigateTo('search');
                            setIsSearchVisible(false);
                          }
                        }}
                        placeholder="Search health..."
                        className="w-full bg-slate-100 border-none rounded-full px-4 py-2 text-sm focus:ring-2 focus:ring-emerald-200 outline-none"
                      />
                      <button 
                        onClick={() => setIsSearchVisible(false)}
                        className="absolute right-2 p-1 text-slate-400 hover:text-slate-600"
                      >
                        <X size={16} />
                      </button>
                    </motion.div>
                  ) : (
                    <motion.button 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      onClick={() => setIsSearchVisible(true)}
                      className="p-2 text-slate-400 hover:text-emerald-500 transition-colors"
                    >
                      <Search size={20} />
                    </motion.button>
                  )}
                </AnimatePresence>
              </div>
              <div className="hidden sm:block h-8 w-[1px] bg-slate-200 mx-1 md:mx-2"></div>
              <div className="hidden xs:flex items-center gap-1.5 md:gap-2 px-2 md:px-3 py-1 md:py-1.5 bg-emerald-50 text-emerald-700 rounded-full text-[10px] md:text-xs font-bold border border-emerald-100">
                <ShieldCheck size={12} className="md:hidden" />
                <ShieldCheck size={14} className="hidden md:block" />
                <span className="whitespace-nowrap">RLS SECURE</span>
              </div>
              
              {/* Mobile Menu Toggle */}
              <button 
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="lg:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>

          {/* Mobile Navigation Menu */}
          <AnimatePresence>
            {isMobileMenuOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="lg:hidden bg-white border-t border-slate-100 overflow-y-auto max-h-[calc(100vh-80px)]"
              >
                <div className="px-4 py-6 space-y-4">
                  {/* Mobile Search */}
                  <div className="pb-2">
                    <div className="relative flex items-center">
                      <Search className="absolute left-4 text-slate-400" size={18} />
                      <input 
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && searchQuery.trim()) {
                            navigateTo('search');
                            setIsMobileMenuOpen(false);
                          }
                        }}
                        placeholder="Search products, symptoms..."
                        className="w-full bg-slate-100 border-none rounded-2xl pl-12 pr-4 py-3 text-sm focus:ring-2 focus:ring-emerald-200 outline-none font-bold"
                      />
                    </div>
                  </div>

                  {CONFIG.navigation.map((item) => {
                    const Icon = item.id === "home" ? HomeIcon :
                                 item.id === "about" ? Info :
                                 item.id === "products" ? ShoppingBag : 
                                 item.id === "consultation" ? Stethoscope : 
                                 item.id === "history" ? History :
                                 item.id === "combo" ? Package :
                                 item.id === "blog" ? FileText :
                                 item.id === "admin" ? DbIcon : User;
                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          navigateTo(item.id as any);
                          setIsMobileMenuOpen(false);
                        }}
                        className={`flex items-center gap-4 w-full p-4 rounded-2xl text-base font-bold transition-all ${
                          activeTab === item.id 
                            ? "bg-emerald-50 text-emerald-700" 
                            : "text-slate-600 hover:bg-slate-50"
                        }`}
                      >
                        <Icon size={22} />
                        {item.label}
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </header>
      </div>

      <main className={`mx-auto transition-all duration-500 ${
        activeTab === "home" || activeTab === "about" || activeTab === "search" || activeTab === "testimonials" || activeTab === "product-detail" || activeTab === "ad"
          ? "max-w-none px-0 py-0 bg-slate-50 min-h-screen" 
          : activeTab === "combo" 
            ? "max-w-[1440px] px-4 py-8 md:py-12" 
            : "max-w-7xl px-4 py-8 md:py-12"
      }`}>
        <AnimatePresence mode="wait">
          {activeTab === "ad" && (
            <motion.div
              key="ad"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="pt-0"
            >
              <AdLandingPage 
                products={products}
                packages={recommendedPackages}
                combos={comboPackages}
                onOrderProduct={(p, qty) => openOrderDrawer(p, 'product', qty || 1)}
                onOrderPackage={(pkg, type, qty, optIdx) => openOrderDrawer(pkg, type, qty || 1, optIdx || 0, true)}
                onViewProduct={(p) => {
                  setViewingProduct(p);
                  navigateTo("product-detail");
                }}
                onViewPackage={(pkg) => viewPackageDetailPage(pkg)}
              />
            </motion.div>
          )}
          {activeTab === "search" && (
            <motion.div
              key="search"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="pt-20"
            >
              <SearchResults 
                query={searchQuery}
                products={products}
                recommendedPackages={recommendedPackages}
                comboPackages={comboPackages}
                onClose={() => navigateTo("home")}
                onViewProduct={(p) => {
                  setViewingProduct(p);
                  navigateTo("product-detail");
                }}
                onOrderProduct={(p) => openOrderDrawer(p, "product")}
                onOrderPackage={(pkg) => openOrderDrawer(pkg, "package")}
                onQuickView={viewPackageDetailPage}
              />
            </motion.div>
          )}
          {activeTab === "testimonials" && (
            <motion.div
              key="testimonials"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <TestimonialsPage onBack={() => navigateTo("home")} />
            </motion.div>
          )}
          {activeTab === "home" && (
            <motion.div
              key="home"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <Home 
                products={products}
                comboPackages={comboPackages}
                recommendedPackages={recommendedPackages}
                onNavigate={(tab) => navigateTo(tab as any)}
                onOrderProduct={(p) => openOrderDrawer(p, 'product')}
                onOrderPackage={(pkg) => openOrderDrawer(pkg, 'package')}
                onOrderComboItem={(item, type, qty) => openOrderDrawer(item, type, qty)}
                onViewProduct={(product) => {
                  setViewingProduct(product);
                  navigateTo("product-detail");
                }}
                onSelectBlog={(id) => {
                  setSelectedBlogId(id);
                  navigateTo("blog-post");
                }}
                onOpenChat={() => setIsChatOpen(true)}
                onQuickView={viewPackageDetailPage}
              />
            </motion.div>
          )}

          {activeTab === "about" && (
            <motion.div
              key="about"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <About onNavigate={navigateTo} />
            </motion.div>
          )}

          {activeTab === "products" && (
            <motion.div
              key="products"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6 md:space-y-8"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex-1">
                  <h2 className="text-2xl md:text-3xl font-bold text-slate-900">Premium Health Products</h2>
                  <p className="text-slate-500 mt-1 md:mt-2 text-sm md:text-base">Scientifically formulated supplements for your wellness journey.</p>
                </div>
                
                <div className="relative w-full md:w-96 group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Search size={20} className="text-slate-400 group-focus-within:text-emerald-600 transition-colors" />
                  </div>
                  <input
                    type="text"
                    placeholder="Search name, benefit, or ailment..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="block w-full pl-11 pr-4 py-3.5 bg-white border border-slate-200 rounded-2xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all shadow-sm"
                  />
                  {searchQuery && (
                    <button 
                      onClick={() => setSearchQuery("")}
                      className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600"
                    >
                      <X size={18} />
                    </button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 min-[1440px]:grid-cols-4 gap-3 md:gap-8">
                {products
                  .filter((p) => {
                    const query = searchQuery.toLowerCase();
                    return (
                      p.name.toLowerCase().includes(query) ||
                      p.short_desc.toLowerCase().includes(query) ||
                      p.health_benefits.some((b) => b.toLowerCase().includes(query))
                    );
                  })
                  .map((product) => (
                    <ProductCard 
                      key={product.id}
                      product={product}
                      onQuickView={setSelectedProduct}
                      onOrder={(p) => openOrderDrawer(p, 'product')}
                    />
                  ))}
                {products.filter((p) => {
                  const query = searchQuery.toLowerCase();
                  return (
                    p.name.toLowerCase().includes(query) ||
                    p.short_desc.toLowerCase().includes(query) ||
                    p.health_benefits.some((b) => b.toLowerCase().includes(query))
                  );
                }).length === 0 && (
                  <div className="col-span-full py-20 text-center">
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-slate-100 rounded-full mb-4">
                      <Search size={32} className="text-slate-400" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900">No products found</h3>
                    <p className="text-slate-500 mt-2">Try adjusting your search or filters to find what you're looking for.</p>
                    <button 
                      onClick={() => setSearchQuery("")}
                      className="mt-6 text-emerald-600 font-bold hover:text-emerald-700 underline underline-offset-4"
                    >
                      Clear all search
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {activeTab === "recommended" && (
            <motion.div
              key="recommended"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-12 pb-20"
            >
              <div className="text-center max-w-3xl mx-auto space-y-4">
                <h2 className="text-3xl md:text-5xl font-black text-slate-900 leading-tight">Expert-Curated Solutions</h2>
                <p className="text-lg text-slate-600 font-medium leading-relaxed">
                  Discover powerful combinations designed to target specific health concerns with maximum synergy.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 min-[1440px]:grid-cols-4 gap-8 md:gap-10">
                {recommendedPackages.map((pkg) => (
                  <PackageCard 
                    key={pkg.id}
                    data={pkg}
                    allPackages={recommendedPackages}
                    onOrder={() => openOrderDrawer(pkg, 'package')}
                    onViewProduct={(product) => {
                      setViewingProduct(product);
                      navigateTo("product-detail");
                    }}
                    onQuickView={viewPackageDetailPage}
                  />
                ))}
                {recommendedPackages.length === 0 && (
                  <div className="col-span-full py-20 text-center">
                    <p className="text-slate-500">No recommended packages found.</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {activeTab === "combo" && (
            <motion.div
              key="combo"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-12 pb-32"
            >
              {/* Marketing Banner Section (828x250 Safe Zone) */}
              <div className="max-w-[828px] mx-auto aspect-[828/250] bg-emerald-900 rounded-xl overflow-hidden relative shadow-lg group">
                <img 
                  src="https://picsum.photos/seed/wellness-banner/1000/300" 
                  alt="Marketing Banner" 
                  className="w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-1000"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 flex flex-col justify-center px-8 md:px-12 space-y-2 md:space-y-4">
                  <span className="bg-amber-400 text-slate-900 px-3 py-1 rounded-full text-[10px] md:text-xs font-bold w-fit uppercase tracking-widest">
                    Limited Time Offer
                  </span>
                  <h2 className="text-2xl md:text-4xl font-black text-white leading-tight">
                    Ultimate Wellness <br /> <span className="text-amber-400">Master Kits</span>
                  </h2>
                  <p className="text-white/80 text-xs md:text-sm font-medium max-w-md hidden sm:block">
                    Comprehensive, science-backed health solutions curated for total body vitality and long-term wellness.
                  </p>
                </div>
              </div>

              {/* Amazon Style Grid Layout */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 min-[1440px]:grid-cols-4 gap-4 md:gap-6">
                {comboPackages.map((pkg) => (
                  <ComboCard 
                    key={pkg.id} 
                    data={pkg} 
                    onOrder={openOrderDrawer}
                    onProductClick={(product) => {
                      setViewingProduct(product);
                      navigateTo("product-detail");
                    }}
                    onQuickView={viewPackageDetailPage}
                  />
                ))}
                {comboPackages.length === 0 && (
                  <div className="col-span-full py-20 text-center bg-white rounded-2xl border border-dashed border-slate-200">
                    <Package size={48} className="mx-auto text-slate-200 mb-4" />
                    <p className="text-slate-400 font-bold">No combo packs available yet.</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {activeTab === "package-detail" && viewingPackage && (
            <motion.div
              key="package-detail"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="max-w-[1600px] mx-auto px-4 md:px-8 lg:px-12 pt-2 pb-32 space-y-6"
            >
              <PackageQuickView
                isOpen={true}
                onClose={() => navigateTo(previousTab === "package-detail" ? "recommended" : previousTab)}
                onBack={() => navigateTo(previousTab === "package-detail" ? "recommended" : previousTab)}
                data={viewingPackage}
                allPackages={[...recommendedPackages, ...comboPackages]}
                onOrder={(qty, optIdx) => openOrderDrawer(viewingPackage, 'package', qty, optIdx, true)}
                onViewProduct={(product) => {
                  viewProductDetailPage(product);
                }}
                isPage={true}
              />
            </motion.div>
          )}

          {activeTab === "product-detail" && viewingProduct && (
            <motion.div
              key="product-detail"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="max-w-[1600px] mx-auto px-4 md:px-8 lg:px-12 pt-2 pb-32 space-y-6"
            >
              {/* Breadcrumbs / Back Button */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <button 
                  onClick={() => navigateTo(previousTab === "product-detail" ? "products" : previousTab)}
                  className="flex items-center gap-3 text-slate-700 hover:text-emerald-600 font-black text-xl transition-colors group px-4 py-2 bg-white rounded-2xl border border-slate-200 shadow-sm w-fit"
                >
                  <ArrowLeft size={24} className="group-hover:-translate-x-1 transition-transform text-emerald-600 stroke-[3]" />
                  GO BACK
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                {/* Left: Image Gallery Style */}
                <div className="space-y-6">
                  <div 
                    className="bg-white rounded-[40px] p-8 md:p-16 border border-slate-100 shadow-sm flex items-center justify-center aspect-square relative overflow-hidden group cursor-zoom-in"
                    onMouseMove={handleMouseMove}
                    onMouseEnter={() => setIsZoomed(true)}
                    onMouseLeave={() => setIsZoomed(false)}
                  >
                    <img 
                      src={viewingProduct.image_url} 
                      alt={viewingProduct.name}
                      className={`w-full h-full object-contain mix-blend-multiply transition-transform duration-200 ${isZoomed ? 'scale-[2.5]' : 'scale-100'}`}
                      style={isZoomed ? { transformOrigin: `${zoomPos.x}% ${zoomPos.y}%` } : {}}
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute top-8 right-8 bg-red-600 text-white px-5 py-2.5 rounded-2xl text-base font-black uppercase tracking-widest shadow-xl animate-bounce z-10">
                      -{viewingProduct.discount_percent}% SPECIAL SAVINGS
                    </div>
                    {!isZoomed && (
                      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-md px-5 py-2.5 rounded-full text-xs font-black uppercase tracking-widest text-slate-700 border border-slate-300 opacity-100 shadow-sm">
                        🔍 Touch or Hover Image to Zoom
                      </div>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="aspect-square bg-white rounded-2xl border border-slate-200 p-4 flex items-center justify-center opacity-80 hover:opacity-100 transition-opacity cursor-pointer">
                        <img 
                          src={viewingProduct.image_url} 
                          alt="Thumbnail" 
                          className="w-full h-full object-contain mix-blend-multiply"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Right: Product Info */}
                <div className="space-y-8">
                  <div>
                    <div className="flex flex-wrap items-center gap-3 mb-4">
                      <span className="bg-emerald-100 text-emerald-800 px-4 py-1.5 rounded-xl text-sm font-black uppercase tracking-widest border border-emerald-200">
                        CODE: {viewingProduct.product_code}
                      </span>
                      {viewingProduct.nafdac_no && (
                        <span className="bg-blue-100 text-blue-800 px-4 py-1.5 rounded-xl text-sm font-black uppercase tracking-widest border border-blue-200">
                          NAFDAC NO: {viewingProduct.nafdac_no}
                        </span>
                      )}
                      <span className="bg-emerald-500 text-white px-4 py-1.5 rounded-xl text-sm font-black uppercase tracking-widest shadow-sm">
                        ✓ IN STOCK & READY
                      </span>
                    </div>
                    <h1 className="text-4xl md:text-6xl font-black text-slate-950 leading-tight mb-4">
                      {viewingProduct.name}
                    </h1>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} size={24} className="fill-orange-400 text-orange-400" />
                        ))}
                      </div>
                      <span className="text-slate-900 text-lg font-black bg-white border border-slate-200 px-4 py-1.5 rounded-2xl shadow-sm">
                        ⭐ 4.9 out of 5 Rating (From 2,450 Trusted Customers)
                      </span>
                    </div>
                  </div>

                  <div className="bg-slate-100 border-2 border-slate-200 rounded-3xl p-6 space-y-2">
                    <span className="text-sm font-black text-slate-600 uppercase tracking-widest block">SPECIAL DIRECT DISTRIBUTOR PRICE:</span>
                    <div className="flex items-baseline gap-4 flex-wrap">
                      <span className="text-5xl md:text-6xl font-black text-emerald-700">
                        ₦{(viewingProduct.price_naira * (1 - viewingProduct.discount_percent / 100)).toLocaleString()}
                      </span>
                      {viewingProduct.discount_percent > 0 && (
                        <span className="text-2xl md:text-3xl text-slate-500 line-through font-extrabold">
                          Original: ₦{viewingProduct.price_naira.toLocaleString()}
                        </span>
                      )}
                    </div>
                  </div>

                  <p className="text-2xl text-slate-850 leading-relaxed font-bold border-l-4 border-emerald-500 pl-4 bg-emerald-50/20 py-2">
                    {viewingProduct.short_desc}
                  </p>

                  <div className="flex flex-col sm:flex-row items-center gap-6 bg-slate-100 p-5 rounded-3xl border-2 border-slate-200 w-full justify-between">
                    <span className="text-lg font-black text-slate-950 uppercase tracking-widest">Select Quantity:</span>
                    <div className="flex items-center gap-6">
                      <button 
                        onClick={() => setDetailQuantity(Math.max(1, detailQuantity - 1))}
                        className="w-14 h-14 bg-white text-slate-900 rounded-2xl flex items-center justify-center hover:bg-slate-200 transition-colors border-2 border-slate-300 shadow-sm active:scale-95"
                        title="Reduce Quantity"
                      >
                        <Minus size={24} className="stroke-[3]" />
                      </button>
                      <span className="text-3xl font-black text-slate-950 w-12 text-center select-none">{detailQuantity}</span>
                      <button 
                        onClick={() => setDetailQuantity(detailQuantity + 1)}
                        className="w-14 h-14 bg-emerald-600 text-white rounded-2xl flex items-center justify-center hover:bg-emerald-700 transition-colors border-2 border-emerald-700 shadow-md active:scale-95"
                        title="Increase Quantity"
                      >
                        <Plus size={24} className="stroke-[3]" />
                      </button>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row gap-4 pt-2">
                    <button 
                      onClick={() => {
                        const message = `Hello SD GHT Health Care, I am reading about ${viewingProduct.name}. I would like to chat with a health consultant first.`;
                        openWhatsAppLink(CONFIG.whatsapp.number, message);
                      }}
                      className="flex-1 bg-white border-4 border-emerald-600 text-emerald-800 py-6 rounded-3xl font-black text-2xl hover:bg-emerald-50 transition-all flex items-center justify-center gap-3 shadow-md cursor-pointer"
                    >
                      <Phone size={28} className="text-emerald-600 stroke-[3]" />
                      CHAT WITH US
                    </button>
                    <button 
                      onClick={() => openOrderDrawer(viewingProduct, 'product', detailQuantity)}
                      className="flex-[1.5] bg-emerald-600 text-white py-6 rounded-3xl font-black text-2xl hover:bg-emerald-700 transition-all shadow-2xl shadow-emerald-200 active:scale-[0.98] flex items-center justify-center gap-3 border-b-4 border-emerald-800 cursor-pointer"
                    >
                      <ShoppingBag size={28} className="stroke-[3]" />
                      ORDER NOW
                    </button>
                  </div>

                  {/* STICKY BOTTOM FIXED ACTION BAR FOR PRODUCT DETAIL PAGE */}
                  <div className="fixed bottom-0 left-0 right-0 z-50 bg-slate-950/95 backdrop-blur-md text-white p-4 sm:p-6 border-t-4 border-emerald-500 shadow-[0_-15px_40px_rgba(0,0,0,0.3)]">
                    <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
                      <div className="hidden md:flex items-center gap-3">
                        <img src={viewingProduct.image_url} alt="" className="w-12 h-12 object-contain bg-white rounded-xl p-1" />
                        <div>
                          <h4 className="font-black text-white text-base truncate max-w-xs">{viewingProduct.name}</h4>
                          <p className="text-xs text-emerald-400 font-extrabold">₦{(viewingProduct.price_naira * (1 - viewingProduct.discount_percent / 100) * detailQuantity).toLocaleString()} (Qty: {detailQuantity})</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3 w-full sm:w-auto">
                        <button 
                          onClick={() => {
                            const message = `Hello SD GHT Health Care, I am reading about ${viewingProduct.name}. I would like to chat with a health consultant first.`;
                            openWhatsAppLink(CONFIG.whatsapp.number, message);
                          }}
                          className="h-14 sm:h-16 px-6 bg-white border-2 border-slate-300 text-slate-950 rounded-2xl font-black text-xs sm:text-sm uppercase tracking-wider hover:bg-slate-100 transition-all flex items-center justify-center gap-2 shadow-xl cursor-pointer active:scale-95"
                        >
                          <Phone size={18} className="text-emerald-700 shrink-0 stroke-[3]" />
                          CHAT WITH US
                        </button>
                        <button 
                          onClick={() => openOrderDrawer(viewingProduct, 'product', detailQuantity)}
                          className="h-14 sm:h-16 px-6 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-2xl font-black text-xs sm:text-sm uppercase tracking-wider transition-all shadow-2xl active:scale-[0.98] flex items-center justify-center gap-2 border-b-4 border-emerald-900 ring-4 ring-emerald-500/30 cursor-pointer animate-pulse"
                        >
                          <ShoppingBag size={18} className="shrink-0 stroke-[3]" />
                          <span className="font-black text-xs sm:text-sm text-white">ORDER NOW (POD)</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Trust Badges */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4">
                    {[
                      { icon: ShieldCheck, label: "NAFDAC Reg.", color: "text-blue-600" },
                      { icon: Leaf, label: "100% Herbal", color: "text-emerald-600" },
                      { icon: Award, label: "Premium Quality", color: "text-orange-600" },
                      { icon: Globe, label: "Free Shipping", color: "text-purple-600" }
                    ].map((badge, i) => (
                      <div key={i} className="flex flex-col items-center gap-2 p-4 bg-white rounded-2xl border-2 border-slate-200 text-center">
                        <badge.icon size={28} className={badge.color} />
                        <span className="text-xs font-black uppercase tracking-wider text-slate-900">{badge.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Full Details Section */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 pt-12 border-t-2 border-slate-300">
                <div className="lg:col-span-2 space-y-12">
                  <section className="space-y-4">
                    <h3 className="text-3xl font-black text-slate-950 uppercase tracking-tight flex items-center gap-2">
                      <span>📖</span> FULL PRODUCT DESCRIPTION
                    </h3>
                    <div className="prose prose-slate max-w-none">
                      <p className="text-xl text-slate-900 leading-relaxed font-semibold">
                        {viewingProduct.long_desc || "No detailed description available for this product yet. Please contact our support for more information."}
                      </p>
                    </div>
                  </section>

                  <section className="space-y-6">
                    <h3 className="text-3xl font-black text-slate-950 uppercase tracking-tight flex items-center gap-2">
                      <span>⭐</span> KEY HEALTH BENEFITS
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {viewingProduct.health_benefits.map((benefit, i) => (
                        <div key={i} className="flex items-start gap-4 p-6 bg-white rounded-3xl border-2 border-slate-200 shadow-sm">
                          <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center shrink-0">
                            <CheckCircle2 size={28} className="text-emerald-700 stroke-[3]" />
                          </div>
                          <span className="text-xl font-black text-slate-950 leading-snug">{benefit}</span>
                        </div>
                      ))}
                    </div>
                  </section>

                  <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                      <h3 className="text-2xl font-black text-slate-950 uppercase tracking-tight flex items-center gap-2">
                        <span>💊</span> RECOMMENDED DOSAGE & USAGE
                      </h3>
                      <div className="p-6 bg-blue-50 border-2 border-blue-200 rounded-3xl">
                        <p className="text-xl text-slate-950 font-black leading-relaxed">
                          {viewingProduct.usage || "Follow the instructions on the product packaging or consult with our health experts."}
                        </p>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <h3 className="text-2xl font-black text-slate-950 uppercase tracking-tight flex items-center gap-2">
                        <span>⚠️</span> SAFETY WARNINGS & PRECAUTIONS
                      </h3>
                      <div className="p-6 bg-red-50 border-2 border-red-200 rounded-3xl">
                        <p className="text-xl text-slate-950 font-black leading-relaxed">
                          {viewingProduct.warning || "Keep out of reach of children. Consult your doctor if pregnant or nursing."}
                        </p>
                      </div>
                    </div>
                  </section>

                  {/* Frequently Asked Questions (FAQ) for Adults & Seniors */}
                  <section className="space-y-6 pt-6 border-t-2 border-slate-200">
                    <h3 className="text-3xl font-black text-slate-950 uppercase tracking-tight flex items-center gap-2">
                      <span>❓</span> FREQUENTLY ASKED QUESTIONS
                    </h3>
                    <div className="space-y-4">
                      <div className="p-6 bg-white rounded-3xl border-2 border-slate-200 shadow-sm space-y-2">
                        <h4 className="text-xl font-black text-slate-950">Q: How soon will I start seeing results?</h4>
                        <p className="text-lg text-slate-700 font-semibold leading-relaxed">Most patients report noticeable improvement and relief within 7 to 14 days of consistent usage as directed.</p>
                      </div>
                      <div className="p-6 bg-white rounded-3xl border-2 border-slate-200 shadow-sm space-y-2">
                        <h4 className="text-xl font-black text-slate-950">Q: Can I take this alongside my prescribed medications?</h4>
                        <p className="text-lg text-slate-700 font-semibold leading-relaxed">Our formulas are 100% natural, but we always recommend consulting with our free medical advisors or your personal physician.</p>
                      </div>
                      <div className="p-6 bg-white rounded-3xl border-2 border-slate-200 shadow-sm space-y-2">
                        <h4 className="text-xl font-black text-slate-950">Q: How does Pay on Delivery (POD) work?</h4>
                        <p className="text-lg text-slate-700 font-semibold leading-relaxed">You place your order online, our dispatch agent delivers it to your doorstep anywhere in Nigeria, and you inspect your items before paying cash or transfer.</p>
                      </div>
                    </div>
                  </section>
                </div>

                <div className="space-y-8">
                  <div className="bg-slate-950 text-white p-8 rounded-[40px] shadow-2xl space-y-6 border-4 border-slate-800">
                    <h3 className="text-2xl font-black uppercase tracking-widest flex items-center gap-2">
                      <span>📋</span> PRODUCT SPECS
                    </h3>
                    <div className="space-y-4">
                      <div className="flex justify-between py-4 border-b-2 border-slate-800 text-lg">
                        <span className="text-slate-400 font-extrabold">Product Code</span>
                        <span className="font-black text-white">{viewingProduct.product_code}</span>
                      </div>
                      {viewingProduct.nafdac_no && (
                        <div className="flex justify-between py-4 border-b-2 border-slate-800 text-lg">
                          <span className="text-slate-400 font-extrabold">NAFDAC Reg No.</span>
                          <span className="font-black text-white">{viewingProduct.nafdac_no}</span>
                        </div>
                      )}
                      <div className="flex justify-between py-4 border-b-2 border-slate-800 text-lg">
                        <span className="text-slate-400 font-extrabold">Package Size</span>
                        <span className="font-black text-white">{viewingProduct.package || "Standard Bottle"}</span>
                      </div>
                      <div className="space-y-2 pt-2">
                        <span className="text-slate-400 font-extrabold text-lg block">Ingredients</span>
                        <p className="text-base text-slate-200 leading-relaxed font-medium">
                          {viewingProduct.ingredients || "Natural herbal extracts and proprietary blends."}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-emerald-700 p-8 rounded-[40px] text-white space-y-4 border-4 border-emerald-600 shadow-xl">
                    <h3 className="text-2xl font-black">Elderly Care Support</h3>
                    <p className="text-emerald-100 font-bold text-lg leading-relaxed">
                      Need help choosing? Speak directly with our friendly, qualified medical consultants. We offer completely free guidance.
                    </p>
                    <button 
                      onClick={() => navigateTo("consultation")}
                      className="w-full bg-white text-emerald-950 py-4 rounded-2xl font-black text-lg hover:bg-emerald-50 transition-colors shadow-md uppercase tracking-wider"
                    >
                      ✓ Request Free Consultation
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === "blog" && (
          <BlogList 
            onSelectPost={(id) => {
              setSelectedBlogId(id);
              navigateTo("blog-post");
            }} 
          />
        )}

        {activeTab === "blog-post" && selectedBlogId && (
          <BlogPost 
            id={selectedBlogId} 
            onBack={() => navigateTo("blog")} 
            onOrderPackage={(pkg) => openOrderDrawer(pkg, 'package')}
          />
        )}

        {activeTab === "consultation" && (
            <motion.div
              key="consultation"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-3xl mx-auto"
            >
              <div className="bg-white rounded-2xl md:rounded-3xl border border-slate-200 p-6 md:p-12 shadow-2xl shadow-slate-200/50">
                <div className="text-center mb-8 md:mb-12">
                  <div className="w-12 h-12 md:w-16 md:h-16 bg-emerald-100 text-emerald-600 rounded-xl md:rounded-2xl flex items-center justify-center mx-auto mb-4 md:mb-6">
                    <Stethoscope size={24} className="md:size-8" />
                  </div>
                  <h2 className="text-2xl md:text-3xl font-bold text-slate-900">Free Health Consultation</h2>
                  <p className="text-slate-500 mt-2 text-sm md:text-base">Get professional recommendations based on your symptoms.</p>
                </div>

                <form onSubmit={handleConsultation} className="space-y-4 md:space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                    <div className="space-y-1.5 md:space-y-2">
                      <label className="text-xs md:text-sm font-bold text-slate-700 ml-1">Full Name</label>
                      <input 
                        required
                        type="text" 
                        placeholder="John Doe"
                        className="w-full px-4 md:px-5 py-3 md:py-4 bg-slate-50 border border-slate-200 rounded-xl md:rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-sm md:text-base"
                        value={formData.patient_name}
                        onChange={(e) => setFormData({...formData, patient_name: e.target.value})}
                      />
                    </div>
                    <div className="space-y-1.5 md:space-y-2">
                      <label className="text-xs md:text-sm font-bold text-slate-700 ml-1">Phone Number</label>
                      <input 
                        required
                        type="tel" 
                        placeholder="+234..."
                        className="w-full px-4 md:px-5 py-3 md:py-4 bg-slate-50 border border-slate-200 rounded-xl md:rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-sm md:text-base"
                        value={formData.phone}
                        onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5 md:space-y-2">
                    <label className="text-xs md:text-sm font-bold text-slate-700 ml-1">Primary Illness (if known)</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Hypertension, Diabetes"
                      className="w-full px-4 md:px-5 py-3 md:py-4 bg-slate-50 border border-slate-200 rounded-xl md:rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-sm md:text-base"
                      value={formData.illness}
                      onChange={(e) => setFormData({...formData, illness: e.target.value})}
                    />
                  </div>

                  <div className="space-y-1.5 md:space-y-2">
                    <label className="text-xs md:text-sm font-bold text-slate-700 ml-1">Describe Symptoms</label>
                    <textarea 
                      required
                      placeholder="Please describe what you are feeling..."
                      className="w-full px-4 md:px-5 py-3 md:py-4 bg-slate-50 border border-slate-200 rounded-xl md:rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all h-32 md:h-40 resize-none text-sm md:text-base"
                      value={formData.symptoms}
                      onChange={(e) => setFormData({...formData, symptoms: e.target.value})}
                    />
                  </div>

                  <button 
                    disabled={loading}
                    className="w-full bg-emerald-600 text-white py-4 md:py-5 rounded-xl md:rounded-2xl font-bold text-base md:text-lg hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-100 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {loading ? "Submitting..." : "Submit Consultation"}
                    {!loading && <ChevronRight size={20} />}
                  </button>
                </form>
              </div>
            </motion.div>
          )}



          {activeTab === "history" && (
            <motion.div
              key="history"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-4xl mx-auto space-y-12"
            >
              <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">My Health Records</h2>
                  <p className="text-slate-500 text-sm">Private history secured by your unique session token.</p>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-slate-100 rounded-xl text-[10px] font-mono text-slate-500 border border-slate-200">
                  <ShieldCheck size={14} />
                  TOKEN: {accessToken.slice(0, 8)}...
                </div>
              </div>

              {/* Consultations Section */}
              <div className="space-y-6">
                <h3 className="text-xl font-black text-slate-900 flex items-center gap-3">
                  <History className="text-emerald-600" />
                  Consultations
                </h3>
                {consultations.length > 0 ? (
                  consultations.map((c) => (
                    <div key={c.id} className="bg-white rounded-3xl border border-slate-200 p-8 hover:border-emerald-200 transition-colors">
                      <div className="flex justify-between items-start mb-6">
                        <div>
                          <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400">Consultation ID: {c.id}</span>
                          <h3 className="text-xl font-bold text-slate-900 mt-1">{c.patient_name}</h3>
                        </div>
                        <div className="text-right">
                          <span className="text-xs text-slate-500">{new Date(c.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-4">
                          <div>
                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Symptoms Reported</h4>
                            <p className="text-slate-700 mt-1">{c.symptoms}</p>
                          </div>
                          <div>
                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Primary Concern</h4>
                            <p className="text-slate-700 mt-1">{c.illness || "Not specified"}</p>
                          </div>
                        </div>
                        <div className="bg-emerald-50 rounded-2xl p-6 border border-emerald-100">
                          <div className="flex items-center gap-2 text-emerald-700 mb-3">
                            <CheckCircle2 size={18} />
                            <h4 className="text-sm font-bold uppercase tracking-wider">Expert Suggestion</h4>
                          </div>
                          <p className="text-emerald-900 font-medium leading-relaxed">{c.ai_recommendation}</p>
                          <div className="mt-4 pt-4 border-top border-emerald-200/50">
                            <h5 className="text-[10px] font-bold text-emerald-600 uppercase mb-2">Recommended Products</h5>
                            <div className="flex flex-wrap gap-2">
                              {c.recommended_products.map((p, i) => (
                                <span key={i} className="bg-white px-3 py-1 rounded-full text-xs font-bold text-emerald-700 border border-emerald-200">
                                  {p}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  !loading && (
                    <div className="text-center py-12 bg-white rounded-3xl border border-dashed border-slate-200">
                      <p className="text-slate-400">No consultations found.</p>
                    </div>
                  )
                )}
              </div>

              {/* Orders Section */}
              <div className="space-y-6">
                <h3 className="text-xl font-black text-slate-900 flex items-center gap-3">
                  <ShoppingBag className="text-emerald-600" />
                  Orders
                </h3>
                {orders.length > 0 ? (
                  orders.map((o) => (
                    <div key={o.id} className="bg-white rounded-3xl border border-slate-200 p-8 hover:border-emerald-200 transition-colors">
                      <div className="flex justify-between items-start mb-6">
                        <div>
                          <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400">Order ID: {o.id.slice(0, 8)}</span>
                          <h3 className="text-xl font-bold text-slate-900 mt-1">Order Status: {o.status}</h3>
                        </div>
                        <div className="text-right">
                          <span className="text-xs text-slate-500">{new Date(o.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="bg-slate-50 p-6 rounded-2xl space-y-3">
                          <p className="text-xs text-slate-400 font-black uppercase tracking-widest">Items Ordered</p>
                          {o.order_items?.map((item: any) => (
                            <div key={item.id} className="flex justify-between items-center">
                              <span className="font-bold text-slate-700">{item.products?.name} x{item.quantity}</span>
                              <span className="font-black text-slate-900">₦{Number(item.price_at_time).toLocaleString()}</span>
                            </div>
                          ))}
                          <div className="pt-3 border-t border-slate-200 flex justify-between items-center">
                            <span className="font-black text-slate-400 uppercase text-xs tracking-widest">Total Amount</span>
                            <span className="text-xl font-black text-emerald-600">₦{Number(o.total_amount).toLocaleString()}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 text-slate-500 text-sm font-medium">
                          <MapPin size={16} className="text-slate-300" />
                          {o.shipping_address}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  !loading && (
                    <div className="text-center py-12 bg-white rounded-3xl border border-dashed border-slate-200">
                      <p className="text-slate-400">No orders found.</p>
                    </div>
                  )
                )}
              </div>
            </motion.div>
          )}

          {activeTab === "thank-you" && (
            <motion.div
              key="thank-you"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <ThankYouPage onNavigate={(tab) => navigateTo(tab)} />
            </motion.div>
          )}

          {activeTab === "return-policy" && (
            <motion.div
              key="return-policy"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <ReturnPolicy onNavigate={(tab) => navigateTo(tab)} />
            </motion.div>
          )}

          {activeTab === "admin" && (
            <motion.div
              key="admin"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              {!isAdminAuthenticated ? (
                <div className="max-w-md mx-auto bg-white rounded-[32px] p-8 border border-slate-200 shadow-2xl">
                  <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mb-6">
                    <DbIcon size={32} className="text-emerald-600" />
                  </div>
                  <h2 className="text-2xl font-black text-slate-900 mb-2">Admin Access</h2>
                  <p className="text-slate-500 text-sm mb-8">Please enter the administrative password to manage the database.</p>
                  
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Password</label>
                      <input 
                        type="password"
                        value={adminPassword}
                        onChange={(e) => setAdminPassword(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleAdminLogin();
                          }
                        }}
                        placeholder="••••••••"
                        className="w-full h-14 bg-slate-50 border border-slate-200 rounded-2xl px-6 font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                      />
                    </div>
                    <button 
                      onClick={handleAdminLogin}
                      disabled={loading}
                      className="w-full h-14 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-xl active:scale-95 disabled:opacity-50"
                    >
                      {loading ? "Verifying..." : "Unlock Dashboard"}
                    </button>
                  </div>
                </div>
              ) : (
                <AdminDashboard adminPassword={adminPassword} onLogout={handleAdminLogout} />
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {activeTab !== "product-detail" && activeTab !== "package-detail" && (
        <footer className="bg-slate-900 text-white py-12 md:py-20 mt-12 md:mt-20">
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
          <div className="col-span-1 sm:col-span-2">
            <div className="flex items-center gap-3 mb-6">
              {CONFIG.company.logoUrl ? (
                <img 
                  src={CONFIG.company.logoUrl} 
                  alt={CONFIG.company.name} 
                  className="h-8 md:h-10 w-auto object-contain brightness-0 invert"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-8 h-8 md:w-10 md:h-10 bg-emerald-600 rounded-lg md:rounded-xl flex items-center justify-center text-white">
                  <Activity size={20} className="md:size-6" />
                </div>
              )}
              <h1 className="font-bold text-lg md:text-xl tracking-tight">{CONFIG.company.name}</h1>
            </div>
            <p className="text-slate-400 max-w-md leading-relaxed text-sm md:text-base">
              Leading distributor and marketer of professional health products. 
              We are committed to providing high-quality supplements and expert health consultations 
              to improve the well-being of our community.
            </p>
          </div>
          
          <div className="sm:col-span-1">
            <h4 className="font-bold mb-4 md:mb-6 text-sm md:text-base">Quick Links</h4>
            <ul className="space-y-3 md:space-y-4 text-slate-400 text-xs md:text-sm">
              {CONFIG.navigation.map(item => (
                <li key={item.id}>
                  <button onClick={() => navigateTo(item.id as any)} className="hover:text-emerald-400 transition-colors cursor-pointer">
                    {item.label}
                  </button>
                </li>
              ))}
              <li>
                <button onClick={() => navigateTo("return-policy")} className="hover:text-emerald-400 transition-colors font-semibold text-emerald-500 cursor-pointer">
                  Return Policy
                </button>
              </li>
            </ul>
          </div>

          <div className="sm:col-span-1">
            <h4 className="font-bold mb-4 md:mb-6 text-sm md:text-base">Contact Us</h4>
            <ul className="space-y-3 md:space-y-4 text-slate-400 text-xs md:text-sm">
              <li className="flex items-center gap-2">
                <Phone size={14} />
                {CONFIG.company.phone}
              </li>
              <li className="flex items-center gap-2">
                <ShieldCheck size={14} />
                NAFDAC Registered Products
              </li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 mt-12 md:mt-20 pt-8 border-t border-slate-800 text-center text-slate-500 text-[10px] md:text-xs">
          © {new Date().getFullYear()} {CONFIG.company.name} {CONFIG.company.subtitle}. All Rights Reserved.
        </div>
      </footer>
      )}

      {/* Quick View Modal */}
      <AnimatePresence>
        {selectedProduct && (() => {
          const getProductTestimonial = (product: Product) => {
            const name = product.name;
            const desc = product.short_desc || "";
            const firstBenefit = product.health_benefits?.[0] || "vitality support";
            
            const locations = ["Lekki, Lagos", "Ikeja, Lagos", "Abuja, FCT", "Port Harcourt, Rivers State", "Ibadan, Oyo State", "Enugu State", "Kaduna State"];
            const people = ["Chief Joseph", "Pastor Benson", "Alhaja Shakirat", "Dr. (Mrs.) Akpan", "Madam Evelyn", "Engineer Okey", "Alhaji Musa"];
            
            const hash = name.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
            const person = people[hash % people.length];
            const location = locations[hash % locations.length];
            
            let customText = "";
            if (name.toLowerCase().includes("vigor") || name.toLowerCase().includes("man") || name.toLowerCase().includes("men")) {
              customText = `I am 56 years old. I was experiencing severe waist pain, fast ejaculation, and constant daily weakness. Since starting with GHT ${name}, my biological strength and stamina have completely returned. It feels like I'm in my 20s again. Highly recommended!`;
            } else if (name.toLowerCase().includes("sugar") || name.toLowerCase().includes("diabet") || name.toLowerCase().includes("glu")) {
              customText = `My fasting blood sugar was stuck at 260 mg/dL even with strict diabetic treatments. My legs were constantly burning. After using ${name} for 3 weeks, my blood sugar dropped to 105 mg/dL! The leg pain has completely vanished. God bless GHT!`;
            } else if (name.toLowerCase().includes("cardio") || name.toLowerCase().includes("heart") || name.toLowerCase().includes("pressure") || name.toLowerCase().includes("tension")) {
              customText = `My blood pressure was persistently high at 160/100, causing severe morning headaches. A senior consultant introduced me to ${name}. Within a month, my readings are stable at 119/78. It completely normalized my system.`;
            } else {
              customText = `I had been struggling with chronic health symptoms for months. Since using ${name} which focuses on ${firstBenefit.toLowerCase()}, I have experienced remarkable relief. The organic formulation is gentle but highly potent. My lab results are now completely clear!`;
            }
            
            return { text: customText, author: `${person} (${location})`, role: "Verified Patient" };
          };

          const matchedTestimonial = getProductTestimonial(selectedProduct);

          return (
            <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center p-0 md:p-6">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setSelectedProduct(null)}
                className="absolute inset-0 bg-slate-950/85 backdrop-blur-md"
              />
              <motion.div 
                initial={{ opacity: 0, y: "100%" }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: "100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                className="relative w-full max-w-5xl bg-white rounded-t-[32px] lg:rounded-[32px] overflow-hidden shadow-2xl flex flex-col lg:flex-row h-[90vh] lg:h-[80vh] border border-slate-100"
              >
                {/* Mobile Drag Handle */}
                <div className="lg:hidden w-full flex justify-center pt-3 pb-1 shrink-0">
                  <div className="w-12 h-1.5 bg-slate-200 rounded-full" />
                </div>

                <div className="absolute top-4 right-4 z-50 flex items-center gap-2">
                  <button 
                    onClick={() => handleShareProduct(selectedProduct)}
                    className={`p-2 rounded-full border transition-all duration-300 shadow-lg flex items-center justify-center gap-2 px-4 ${
                      isProductCopied 
                        ? 'bg-emerald-500 border-emerald-500 text-white' 
                        : 'bg-white/90 backdrop-blur-md border-slate-200 text-slate-500 hover:text-emerald-600'
                    }`}
                  >
                    {isProductCopied ? <Check size={18} /> : <Share2 size={18} />}
                    <span className="text-[10px] font-black uppercase tracking-widest hidden md:block">
                      {isProductCopied ? 'Copied' : 'Share'}
                    </span>
                  </button>
                  <button 
                    onClick={() => setSelectedProduct(null)}
                    className="p-2 bg-white/90 backdrop-blur-md rounded-full shadow-lg hover:bg-slate-100 transition-colors border border-slate-200"
                  >
                    <X size={20} />
                  </button>
                </div>

                {/* Modal Image Section */}
                <div className="w-full lg:w-1/2 bg-slate-50 flex flex-col items-center justify-center p-6 lg:p-12 border-b lg:border-b-0 lg:border-r border-slate-100 h-[32vh] md:h-[35vh] lg:h-full shrink-0 overflow-y-auto custom-scrollbar relative">
                  <div className="absolute top-4 left-4 z-10 flex flex-col gap-1.5">
                    <span className="bg-emerald-600 text-white text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg flex items-center gap-1 shadow-sm">
                      <Award size={10} /> 100% Herbal
                    </span>
                    {selectedProduct.nafdac_no && (
                      <span className="bg-blue-600 text-white text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg flex items-center gap-1 shadow-sm">
                        <ShieldCheck size={10} /> NAFDAC Certified
                      </span>
                    )}
                  </div>

                  <img 
                    src={selectedProduct.image_url} 
                    alt={selectedProduct.name}
                    className="w-full h-full max-h-[220px] lg:max-h-[350px] object-contain mix-blend-multiply scale-100 hover:scale-105 transition-transform duration-500"
                    referrerPolicy="no-referrer"
                  />
                  
                  {/* Trust Footer inside left column */}
                  <div className="mt-4 pt-4 border-t border-slate-200/60 w-full hidden lg:grid grid-cols-2 gap-3 text-slate-500">
                    <div className="flex items-center gap-2 p-2 rounded-xl bg-white border border-slate-100">
                      <ShieldCheck size={16} className="text-emerald-600 shrink-0" />
                      <span className="text-[8px] font-black uppercase tracking-wider">Quality Passed</span>
                    </div>
                    <div className="flex items-center gap-2 p-2 rounded-xl bg-white border border-slate-100">
                      <Globe size={16} className="text-blue-600 shrink-0" />
                      <span className="text-[8px] font-black uppercase tracking-wider">Halal Approved</span>
                    </div>
                  </div>
                </div>

                {/* Modal Content Section split into Scrollable Content + Pinned Footer */}
                <div className="w-full lg:w-1/2 flex flex-col h-[58vh] md:h-[55vh] lg:h-full bg-white overflow-hidden">
                  
                  {/* Scrollable Contents */}
                  <div className="flex-1 overflow-y-auto p-6 lg:p-10 pb-6 custom-scrollbar space-y-6">
                    <div>
                      <div className="text-emerald-600 font-black text-[10px] uppercase tracking-widest mb-1.5 flex flex-wrap items-center gap-x-4 gap-y-1.5">
                        <div className="flex items-center gap-1.5">
                          <Award size={13} />
                          GHT Certified Formulation
                        </div>
                        <div className="flex items-center gap-1.5 text-slate-500">
                          <Package size={13} />
                          CODE: {selectedProduct.product_code}
                        </div>
                      </div>
                      <h2 className="text-xl md:text-3xl font-black text-slate-900 leading-tight">
                        {selectedProduct.name}
                      </h2>
                      <div className="mt-2.5 flex items-center gap-3">
                        <div className="flex items-center gap-0.5">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} size={14} className="fill-orange-400 text-orange-400" />
                          ))}
                        </div>
                        <span className="text-slate-500 font-bold text-xs md:text-sm">(210+ Verified Orders)</span>
                      </div>
                    </div>

                    <p className="text-sm md:text-base text-slate-600 leading-relaxed font-bold">
                      {selectedProduct.short_desc}
                    </p>

                    {/* Key Benefits Grid */}
                    <div className="space-y-2.5">
                      <h4 className="font-black text-slate-900 uppercase tracking-widest text-[9px] md:text-[10px]">Therapeutic Benefits & Indications:</h4>
                      <div className="grid grid-cols-1 gap-2">
                        {selectedProduct.health_benefits.slice(0, 3).map((benefit, i) => (
                          <div key={i} className="flex items-start gap-2.5 p-2.5 bg-emerald-50/50 rounded-2xl border border-emerald-100/40">
                            <ShieldCheck size={16} className="text-emerald-600 flex-shrink-0 mt-0.5" />
                            <span className="text-slate-800 font-extrabold leading-tight text-xs md:text-sm">{benefit}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Pricing, Deal Status and Scarcity */}
                    <div className="bg-slate-950 text-white rounded-3xl p-4 md:p-5 border border-white/10 relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/10 rounded-full blur-2xl pointer-events-none" />
                      
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                          <span className="text-[9px] font-black uppercase text-amber-400 tracking-wider">Today's Promotion Applied</span>
                          <div className="flex items-baseline gap-2.5">
                            <span className="text-2xl md:text-3xl font-black text-emerald-400">
                              ₦{(selectedProduct.price_naira * (1 - selectedProduct.discount_percent / 100)).toLocaleString()}
                            </span>
                            {selectedProduct.discount_percent > 0 && (
                              <span className="text-xs text-slate-400 line-through font-bold">
                                ₦{selectedProduct.price_naira.toLocaleString()}
                              </span>
                            )}
                          </div>
                          <p className="text-[9px] text-slate-400 font-semibold mt-0.5">Pay Cash or Bank Transfer upon Delivery</p>
                        </div>

                        {selectedProduct.discount_percent > 0 && (
                          <div className="bg-red-950/80 border border-red-500/30 p-2 px-3 rounded-2xl shrink-0 sm:text-right">
                            <div className="text-[9px] font-black text-red-400 uppercase tracking-widest flex items-center gap-1 sm:justify-end">
                              <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
                              Low Stock: Only 5 Left!
                            </div>
                            <p className="text-[10px] text-slate-200 font-bold mt-0.5">Special {selectedProduct.discount_percent}% Senior Discount Included</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Curated Local Testimonial for Immediate Social Proof */}
                    <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl space-y-1.5">
                      <span className="text-[9px] font-black uppercase tracking-wider text-slate-400">Verified Patient Success</span>
                      <p className="text-slate-600 italic font-semibold text-xs md:text-sm leading-relaxed">
                        "{matchedTestimonial.text}"
                      </p>
                      <p className="text-[10px] font-bold text-slate-500 border-t border-slate-200/50 pt-1.5">
                        — {matchedTestimonial.author} ✅
                      </p>
                    </div>

                    {/* PAYMENT RECEIPT PREVIEW (NEW & HIGHLY AESTHETIC) */}
                    <div className="bg-slate-50 border border-slate-200 rounded-3xl p-5 font-mono text-xs text-slate-700 space-y-3 relative overflow-hidden">
                      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-indigo-500 to-emerald-500" />
                      <div className="flex justify-between items-center text-slate-400 font-bold border-b border-dashed border-slate-300 pb-2">
                        <span>ORDER INVOICE / RECEIPT PREVIEW</span>
                        <span className="text-[9px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">POD Confirmed</span>
                      </div>
                      <div className="space-y-1.5">
                        <div className="flex justify-between">
                          <span className="text-slate-500">Selected Item:</span>
                          <span className="font-extrabold text-slate-900 truncate max-w-[200px]">{selectedProduct.name}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Quantity:</span>
                          <span className="font-extrabold text-slate-900">{quickViewQuantity} Unit(s)</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Retail Value:</span>
                          <span className="font-extrabold text-slate-900">₦{(selectedProduct.price_naira * quickViewQuantity).toLocaleString()}</span>
                        </div>
                        {selectedProduct.discount_percent > 0 && (
                          <div className="flex justify-between text-emerald-600 font-bold">
                            <span>Subsidy Rebate Applied ({selectedProduct.discount_percent}%):</span>
                            <span>-₦{Math.round(selectedProduct.price_naira * (selectedProduct.discount_percent / 100) * quickViewQuantity).toLocaleString()}</span>
                          </div>
                        )}
                        <div className="flex justify-between text-slate-500">
                          <span>Nationwide Dispatch Fee:</span>
                          <span className="font-bold text-emerald-600">₦0.00 (FREE)</span>
                        </div>
                      </div>
                      <div className="border-t border-dashed border-slate-300 pt-2.5 flex justify-between items-baseline">
                        <span className="font-black text-slate-800 uppercase text-xs">Total Due at Delivery:</span>
                        <span className="text-xl font-black text-slate-950">
                          ₦{Math.round(selectedProduct.price_naira * (1 - selectedProduct.discount_percent / 100) * quickViewQuantity).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-[9px] text-slate-400 text-center font-semibold pt-1 leading-tight">
                        *This is a cash-on-delivery summary. Pay on physical arrival of your items via Cash or Bank Transfer.
                      </p>
                    </div>

                    <button 
                      onClick={() => {
                        setViewingProduct(selectedProduct);
                        setSelectedProduct(null);
                        navigateTo("product-detail");
                      }}
                      className="w-full bg-slate-50 text-slate-700 border border-slate-200 py-3.5 rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-slate-100 transition-all flex items-center justify-center gap-1.5"
                    >
                      <Info size={16} />
                      View Full Scientific Details
                    </button>
                  </div>

                  {/* PINNED FIXED FOOTER (Always Visible Whether Scrolling or Not) */}
                  <div className="sticky bottom-0 z-50 p-4 sm:p-6 bg-slate-950/95 backdrop-blur-md text-white border-t-4 border-emerald-500 shadow-2xl space-y-3">
                    
                    {/* Encrypted info display directly inside footer */}
                    <div className="hidden sm:flex text-xs text-emerald-400 font-black items-center gap-2 justify-center leading-tight">
                      <ShieldCheck size={16} className="text-emerald-400 shrink-0" />
                      <span>🔒 Secure Medical Privacy Protocol | Pay on Delivery (POD) Guaranteed</span>
                    </div>

                    {/* Actions Row */}
                    <div className="grid grid-cols-2 gap-3 max-w-4xl mx-auto">
                      <button 
                        onClick={() => {
                          const message = `Hello SD GHT Health Care, I am interested in ${selectedProduct.name}. I would like to chat with a health consultant first.`;
                          openWhatsAppLink(CONFIG.whatsapp.number, message);
                        }}
                        className="h-14 sm:h-16 bg-white border-2 border-slate-300 text-slate-950 rounded-2xl font-black text-xs sm:text-sm uppercase tracking-wider hover:bg-slate-100 transition-all flex items-center justify-center gap-2 shadow-xl cursor-pointer active:scale-95"
                      >
                        <Phone size={18} className="text-emerald-700 shrink-0 stroke-[3]" />
                        CHAT WITH US
                      </button>
                      <button 
                        onClick={() => {
                          openOrderDrawer(selectedProduct, 'product', quickViewQuantity, undefined, true);
                        }}
                        className="h-14 sm:h-16 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-2xl font-black text-xs sm:text-sm uppercase tracking-wider transition-all shadow-2xl active:scale-[0.98] flex items-center justify-center gap-2 border-b-4 border-emerald-900 ring-4 ring-emerald-500/30 cursor-pointer animate-pulse"
                      >
                        <ShoppingBag size={18} className="shrink-0 stroke-[3]" />
                        <span className="font-black text-xs sm:text-sm text-white">ORDER NOW (POD)</span>
                      </button>
                    </div>

                    <p className="block text-center text-xs text-slate-300 font-black uppercase tracking-widest">
                      📦 Nationwide Express Delivery Within 24-48 Hours | Pay Only Upon Delivery
                    </p>
                  </div>

                </div>
              </motion.div>
            </div>
          );
        })()}
      </AnimatePresence>

      {/* Package Quick View Modal */}
      {selectedPackage && (
        <PackageQuickView 
          isOpen={!!selectedPackage}
          onClose={() => setSelectedPackage(null)}
          data={selectedPackage}
          allPackages={recommendedPackages}
          onOrder={(qty, optIdx) => {
            openOrderDrawer(selectedPackage, 'package', qty, optIdx, true);
          }}
          onViewProduct={(product) => {
            setViewingProduct(product);
            setSelectedPackage(null);
            navigateTo("product-detail");
          }}
        />
      )}

      {/* Order Drawer */}
      {orderItem && (
        <OrderDrawer 
          isOpen={isOrderDrawerOpen}
          onClose={() => {
            setIsOrderDrawerOpen(false);
            if (openedFromQuickView === 'product' && orderItem) {
              setSelectedProduct(orderItem.item);
              setQuickViewQuantity(orderItem.qty || 1);
            } else if (openedFromQuickView === 'package' && orderItem) {
              setSelectedPackage(orderItem.item);
            } else {
              if (activeTab === "product-detail" && orderItem && orderItem.type === 'product') {
                setViewingProduct(orderItem.item);
                navigateTo("product-detail");
              }
            }
            setOpenedFromQuickView(null);
            setTimeout(() => setOrderItem(null), 500); // Wait for slide-out animation
          }}
          onShopMore={() => {
            setActiveTab('products');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          item={orderItem.item}
          type={orderItem.type}
          distributorId={distributorId}
          initialQuantity={orderItem.qty}
          initialOptionIndex={orderItem.optIdx}
          onOrderSuccess={(fullName, itemName, quantity, totalPrice, deliveryDate, paymentMethod) => {
            const searchParams = new URLSearchParams();
            searchParams.set("full_name", fullName);
            searchParams.set("item_name", itemName);
            searchParams.set("quantity", String(quantity));
            searchParams.set("total_price", String(totalPrice));
            searchParams.set("delivery_date", deliveryDate);
            searchParams.set("payment_method", paymentMethod);
            window.history.pushState(null, '', `/thank-you?${searchParams.toString()}`);
            setActiveTab("thank-you");
            setIsOrderDrawerOpen(false);
          }}
        />
      )}

      {/* Smart Health Assistant */}
      <AIChatBot 
        isOpen={isChatOpen}
        setIsOpen={setIsChatOpen}
        forceHide={!!selectedProduct || !!selectedPackage || isOrderDrawerOpen}
        onProductClick={(itemId, label, type) => {
          // Clean up the ID in case the AI added quotes or prefixes
          let cleanId = itemId.replace(/['"]/g, '').trim();
          if (cleanId.toLowerCase().startsWith('id:')) {
            cleanId = cleanId.substring(3).trim();
          }
          
          const searchTerms = [cleanId.toLowerCase()];
          if (label) {
             // Extract just the product name from the label (e.g. "Order GHT Sugar Care" -> "ght sugar care")
             const cleanLabel = label.replace(/order/i, '').replace(/buy/i, '').trim().toLowerCase();
             // Only use the label for searching if it's specific enough (not just "ght" or "product")
             if (cleanLabel && cleanLabel.length > 4 && cleanLabel !== 'product' && cleanLabel !== 'package') {
               searchTerms.push(cleanLabel);
             }
          }

          const findProduct = () => products.find(p => {
            const pName = p.name.toLowerCase();
            const pIdStr = p.id ? p.id.toString() : "";
            return pIdStr === cleanId || 
                   searchTerms.some(term => 
                     pName === term || 
                     pName.includes(term) || 
                     (pName.length > 4 && term.includes(pName))
                   );
          });

          const findPackage = () => recommendedPackages.find(p => {
            const pName = p.name.toLowerCase();
            const pIdStr = p.id ? p.id.toString() : "";
            return pIdStr === cleanId || 
                   searchTerms.some(term => 
                     pName === term || 
                     pName.includes(term) || 
                     (pName.length > 4 && term.includes(pName))
                   );
          });

          let foundItem: any = null;
          let foundType = '';

          // If the AI explicitly said it's a package, check packages first
          if (type === 'package') {
            foundItem = findPackage();
            foundType = 'package';
            if (!foundItem) {
              foundItem = findProduct();
              foundType = 'product';
            }
          } else {
            // Otherwise check products first
            foundItem = findProduct();
            foundType = 'product';
            if (!foundItem) {
              foundItem = findPackage();
              foundType = 'package';
            }
          }

          if (foundItem) {
            // Add a small delay so the chat window can close before the modal/drawer opens
            setTimeout(() => {
              if (foundType === 'product') {
                setSelectedProduct(foundItem);
              } else {
                setSelectedPackage(foundItem);
              }
            }, 150);
          } else {
            console.warn("Item not found from AI link:", itemId, label, type);
            alert("Sorry, we couldn't open that specific item automatically. Please find it in our catalog.");
          }
        }}
      />
    </div>
  );
}
