
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { 
  Plus, 
  Trash2, 
  Search, 
  Package, 
  CheckCircle2, 
  X, 
  ChevronLeft, 
  AlertTriangle, 
  FileUp, 
  AlertCircle,
  Layers,
  Database,
  Settings,
  Percent,
  FileSpreadsheet,
  LogIn,
  Image as ImageIcon,
  Tag,
  RotateCcw,
  Sparkles,
  Loader2,
  BrainCircuit,
  Receipt,
  TrendingUp,
  TrendingDown,
  Coins,
  Calculator,
  Info,
  ShieldCheck,
  Star,
  Zap,
  ThumbsUp,
  Wand2
} from 'lucide-react';
import { GoogleGenAI, Type } from "@google/genai";

// --- 数据接口定义 ---
interface Product {
  id: string;
  sku: string;         
  name: string;        
  spec: string;        
  unit: string;        
  platformPrice: number; 
  channelPrice: number;  
  retailPrice: number;   
  image: string;         
  manufacturer: string;  
  category: string;      
}

interface Tier {
  id: string;
  label: string;
  targetTierPrice: number;   
  discountRate: number;      
  quantity: number;          
  boxCost: number;           
  laborCost: number;         
  logisticsCost: number;     
  taxRate: number;           
  selectedProductIds: string[];
}

interface GiftSet {
  id: string;
  name: string;
  createdAt: number;
  tiers: Tier[];
}

interface RecommendationResult {
  productId: string;
  reason: string;
  confidence: number;
}

const STORAGE_KEY_PRODUCTS = 'SHANSHUI_DB_PRODUCTS_V25';
const STORAGE_KEY_GIFTSETS = 'SHANSHUI_DB_GIFTSETS_V25';
const STORAGE_KEY_AUTH = 'SHANSHUI_AUTH_V1';

const LOGO_URL = "https://img.lenyiin.com/app/hide.php?key=S0d4Y1N4YThGNkRHbnV4U1lrL1BBMDVncmc1Q1ZhZkZPR2c4dUg0PQ==";

const DEFAULT_PRODUCTS: Product[] = [
  { id: '1', sku: 'ZS-CJ-001', name: '青山远黛-禅意茶具', spec: '一壶四杯', unit: '套', platformPrice: 150, channelPrice: 299, retailPrice: 599, image: 'https://images.unsplash.com/photo-1576020488411-26298acb51bd?auto=format&fit=crop&q=80&w=400', manufacturer: '景德镇文创', category: '茶具' },
];

const HEADER_MAP: Record<string, string[]> = {
  sku: ['SKU编码', 'sku', '编号', 'SKU'],
  name: ['产品名称', '品名', '名称', '选品名称'],
  spec: ['规格', '尺寸', '参数'],
  unit: ['单位', '量词'],
  platformPrice: ['平台价', '采购价', '成本', '采购单价'],
  channelPrice: ['渠道价', '分销价', '结算价'],
  retailPrice: ['零售价', '市场价', '市场零售价'],
  image: ['素材CDN', '图片', '链接', '图片URL'],
  manufacturer: ['厂商名称', '厂家', '品牌'],
  category: ['电商分类', '分类', '类目']
};

function Modal({ isOpen, onClose, title, children, maxWidth = "max-w-md" }: { isOpen: boolean, onClose: () => void, title: string, children?: React.ReactNode, maxWidth?: string }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative bg-white rounded-[24px] w-full ${maxWidth} shadow-2xl overflow-hidden border border-[#E5E1D1] animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]`}>
        <div className="px-6 py-4 border-b border-[#F5F2E8] flex justify-between items-center bg-[#FDFCF8] shrink-0">
          <h3 className="text-lg font-bold text-[#1B4332] font-serif">{title}</h3>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-[#1B4332] transition-colors bg-[#F5F2E8] rounded-full active:scale-90">
            <X size={18} />
          </button>
        </div>
        <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
          {children}
        </div>
      </div>
    </div>
  );
}

const ProductImage = ({ src, className, name, onHover }: { src?: string, className?: string, name?: string, onHover?: (url: string | null, e: React.MouseEvent) => void }) => {
  const [imgUrl, setImgUrl] = useState(src);
  const [error, setError] = useState(false);

  useEffect(() => {
    const trimmed = src?.trim();
    setImgUrl(trimmed);
    setError(false);
  }, [src]);

  const handleMouseEnter = (e: React.MouseEvent) => {
    if (imgUrl && !error) onHover?.(imgUrl, e);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (imgUrl && !error) onHover?.(imgUrl, e);
  };

  const handleMouseLeave = () => {
    onHover?.(null, null as any);
  };

  if (!imgUrl || error) {
    return (
      <div className={`${className} bg-[#F9F7F2] flex flex-col items-center justify-center text-[#E5E1D1] border border-[#E5E1D1] overflow-hidden`}>
        <ImageIcon size={className?.includes('w-12') ? 16 : 20} />
      </div>
    );
  }

  return (
    <img 
      src={imgUrl} 
      className={`${className} object-cover cursor-zoom-in`}
      onError={() => setError(true)} 
      onMouseEnter={handleMouseEnter}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      alt={name || "Product"}
      loading="lazy"
    />
  );
};

const FilterRow = ({ label, icon: Icon, items, activeItem, onSelect }: { label: string, icon: any, items: string[], activeItem: string, onSelect: (item: string) => void }) => {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-1.5 px-1">
        <Icon size={10} className="text-[#B08D57]" />
        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">{label}</span>
      </div>
      <div className="flex flex-wrap gap-1">
        {items.map(item => (
          <button
            key={item}
            onClick={() => onSelect(item)}
            className={`px-2.5 py-1 rounded-lg text-[9px] font-bold transition-all border ${
              activeItem === item 
              ? 'bg-[#1B4332] text-white border-[#1B4332] shadow-sm' 
              : 'bg-white text-gray-400 border-[#E5E1D1] hover:border-[#1B4332] hover:text-[#1B4332]'
            }`}
          >
            {item}
          </button>
        ))}
      </div>
    </div>
  );
};

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(() => localStorage.getItem(STORAGE_KEY_AUTH) === 'true');
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [loginError, setLoginError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [products, setProducts] = useState<Product[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_PRODUCTS);
    return saved ? JSON.parse(saved) : DEFAULT_PRODUCTS;
  });

  const [giftSets, setGiftSets] = useState<GiftSet[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_GIFTSETS);
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => { localStorage.setItem(STORAGE_KEY_PRODUCTS, JSON.stringify(products)); }, [products]);
  useEffect(() => { localStorage.setItem(STORAGE_KEY_GIFTSETS, JSON.stringify(giftSets)); }, [giftSets]);

  const [currentSetId, setCurrentSetId] = useState<string | null>(null);
  const [activeTierId, setActiveTierId] = useState<string | null>(null);
  const [editingTierId, setEditingTierId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('全部');
  const [sortBy, setSortBy] = useState<'default' | 'price-asc' | 'price-desc'>('default');
  const [lastAddedId, setLastAddedId] = useState<string | null>(null);
  const [hoveredImage, setHoveredImage] = useState<{url: string, x: number, y: number} | null>(null);

  const [isPackageModalOpen, setIsPackageModalOpen] = useState(false);
  const [isTierModalOpen, setIsTierModalOpen] = useState(false);
  const [isLibraryModalOpen, setIsLibraryModalOpen] = useState(false);
  
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);
  const [aiRequirement, setAIRequirement] = useState('');
  const [isAIThinking, setIsAIThinking] = useState(false);
  const [aiActiveTier, setAIActiveTier] = useState<Tier | null>(null);
  const [aiRecommendations, setAIRecommendations] = useState<RecommendationResult[]>([]);

  const [inputValue, setInputValue] = useState('');
  
  const [tierForm, setTierForm] = useState({
    targetPrice: '500',
    discount: '80',
    quantity: '100',
    box: '25',
    labor: '5',
    logistics: '15',
    tax: '6'
  });

  const categories = useMemo(() => ['全部', ...Array.from(new Set(products.map(p => p.category).filter(Boolean)))], [products]);
  const currentSet = useMemo(() => giftSets.find(s => s.id === currentSetId) || null, [giftSets, currentSetId]);

  const sortedFilteredProducts = useMemo(() => {
    let result = [...products].filter(p => {
      const match = (p.name || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
                    (p.sku || '').toLowerCase().includes(searchTerm.toLowerCase());
      const catMatch = activeCategory === '全部' || p.category === activeCategory;
      return match && catMatch;
    });
    
    if (sortBy === 'price-asc') result.sort((a, b) => a.retailPrice - b.retailPrice);
    else if (sortBy === 'price-desc') result.sort((a, b) => b.retailPrice - a.retailPrice);
    
    return result;
  }, [searchTerm, activeCategory, sortBy, products]);

  const handleImageHover = (url: string | null, e: React.MouseEvent) => {
    if (!url) {
      setHoveredImage(null);
      return;
    }
    setHoveredImage({ url, x: e.clientX, y: e.clientY });
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (loginForm.username === 'admin' && loginForm.password === 'zj123456') {
      setIsLoggedIn(true);
      // Fix: localStorage.setItem requires key and value arguments, and it returns void (so comparison is invalid)
      localStorage.setItem(STORAGE_KEY_AUTH, 'true');
      setLoginError('');
    } else {
      setLoginError('账号或密码错误');
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    localStorage.removeItem(STORAGE_KEY_AUTH);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    try {
      const arrayBuffer = await file.arrayBuffer();
      let text = '';
      try {
        const utf8Decoder = new TextDecoder('utf-8', { fatal: true });
        text = utf8Decoder.decode(arrayBuffer);
      } catch (err) {
        const gbkDecoder = new TextDecoder('gbk');
        text = gbkDecoder.decode(arrayBuffer);
      }
      
      const rows = text.split(/\r?\n/).filter(r => r.trim() !== '');
      if (rows.length < 2) throw new Error('表格格式不正确');
      
      const parseLine = (line: string) => {
        const result = [];
        let current = '';
        let inQuotes = false;
        for (let i = 0; i < line.length; i++) {
          const char = line[i];
          if (char === '"') inQuotes = !inQuotes;
          else if (char === ',' && !inQuotes) { result.push(current.trim()); current = ''; }
          else current += char;
        }
        result.push(current.trim());
        return result;
      };

      const headerRow = parseLine(rows[0]);
      const findIndex = (keys: string[]) => {
        const idx = headerRow.findIndex(h => keys.some(k => h.trim().toLowerCase() === k.toLowerCase()));
        if (idx !== -1) return idx;
        return headerRow.findIndex(h => keys.some(k => h.toLowerCase().includes(k.toLowerCase())));
      };

      const mapping = {
        sku: findIndex(HEADER_MAP.sku),
        name: findIndex(HEADER_MAP.name),
        spec: findIndex(HEADER_MAP.spec),
        unit: findIndex(HEADER_MAP.unit),
        platformPrice: findIndex(HEADER_MAP.platformPrice),
        channelPrice: findIndex(HEADER_MAP.channelPrice),
        retailPrice: findIndex(HEADER_MAP.retailPrice),
        category: findIndex(HEADER_MAP.category),
        image: findIndex(HEADER_MAP.image),
        manufacturer: findIndex(HEADER_MAP.manufacturer)
      };

      const cleanNum = (v: string) => {
        if (!v) return 0;
        const cleaned = v.replace(/[^\d.]/g, '');
        return parseFloat(cleaned) || 0;
      };
      
      const newProducts = rows.slice(1).map((row, i) => {
        const cols = parseLine(row);
        return {
          id: Date.now().toString() + i + Math.random().toString(36).substr(2, 5),
          sku: mapping.sku !== -1 ? cols[mapping.sku] : `SKU-${i}`,
          name: mapping.name !== -1 ? cols[mapping.name] : '未命名',
          spec: mapping.spec !== -1 ? cols[mapping.spec] : '', 
          unit: mapping.unit !== -1 ? cols[mapping.unit] : '', 
          platformPrice: mapping.platformPrice !== -1 ? cleanNum(cols[mapping.platformPrice]) : 0,
          channelPrice: mapping.channelPrice !== -1 ? cleanNum(cols[mapping.channelPrice]) : 0,
          retailPrice: mapping.retailPrice !== -1 ? cleanNum(cols[mapping.retailPrice]) : 0,
          image: mapping.image !== -1 ? cols[mapping.image] : '',
          manufacturer: mapping.manufacturer !== -1 ? cols[mapping.manufacturer] : '',
          category: mapping.category !== -1 ? cols[mapping.category] : '默认'
        };
      });
      setProducts(prev => [...newProducts, ...prev]);
      alert(`已成功导入 ${newProducts.length} 条产品数据`);
    } catch (err) { 
      console.error(err);
      alert('导入失败，请确保CSV格式正确且编码为UTF-8或GBK。'); 
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleExportScheme = () => {
    if (!currentSet) return;
    let csvContent = "\uFEFF"; 
    // 头部字段 - 14个汇总列 + 5个产品详情列
    csvContent += "方案名称,档位营收价,选品折率,数量,非折扣零售总额,整体折扣率,折后展示总价,全采购成本,单套杂费,预估税额,单套全成本,单套净利,净利率,全案总投入,产品名称,SKU,零售单价,折后单价,采购单价\n";
    
    currentSet.tiers.forEach(tier => {
      const items = tier.selectedProductIds.map(id => products.find(p => p.id === id)).filter(Boolean) as Product[];
      
      const revenuePerUnit = tier.targetTierPrice;
      const totalRetail = items.reduce((s, p) => s + p.retailPrice, 0); 
      const discountRateDecimal = tier.discountRate / 100;
      const overallDiscountRate = totalRetail > 0 ? (revenuePerUnit / totalRetail) * 100 : 0;
      
      const productPresentationValue = totalRetail * discountRateDecimal; 
      const totalPlatformPurchaseCost = items.reduce((s, p) => s + p.platformPrice, 0);
      
      const otherCosts = tier.boxCost + tier.laborCost + tier.logisticsCost;
      const taxAmount = (productPresentationValue + otherCosts) * (tier.taxRate / 100);
      
      const totalUnitCost = totalPlatformPurchaseCost + otherCosts + taxAmount;
      const netProfit = revenuePerUnit - totalUnitCost;
      const marginPercentage = revenuePerUnit > 0 ? (netProfit / revenuePerUnit) * 100 : 0;
      const totalProjectInvestment = totalUnitCost * tier.quantity;

      items.forEach((it, idx) => {
        if (idx === 0) {
          // 第一行包含档位汇总数据
          const rowData = [
            currentSet.name,
            revenuePerUnit,
            `${tier.discountRate}%`,
            tier.quantity,
            totalRetail.toFixed(2),
            `${overallDiscountRate.toFixed(2)}%`,
            productPresentationValue.toFixed(2),
            totalPlatformPurchaseCost.toFixed(2),
            otherCosts.toFixed(2),
            taxAmount.toFixed(2),
            totalUnitCost.toFixed(2),
            netProfit.toFixed(2),
            `${marginPercentage.toFixed(2)}%`,
            totalProjectInvestment.toFixed(2),
            `"${it.name}"`,
            it.sku,
            it.retailPrice,
            (it.retailPrice * discountRateDecimal).toFixed(2),
            it.platformPrice
          ];
          csvContent += rowData.join(',') + '\n';
        } else {
          // 非第一行使用 14 个空列确保产品详情列精确对齐
          const rowData = [
            ...new Array(14).fill(''), // 14个留白
            `"${it.name}"`,
            it.sku,
            it.retailPrice,
            (it.retailPrice * discountRateDecimal).toFixed(2),
            it.platformPrice
          ];
          csvContent += rowData.join(',') + '\n';
        }
      });
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.setAttribute("href", URL.createObjectURL(blob));
    link.setAttribute("download", `方案报表_${currentSet.name}_${new Date().toLocaleDateString()}.csv`);
    link.click();
  };

  const handleCreateSet = () => {
    if (!inputValue.trim()) return;
    const id = Date.now().toString();
    const newSet: GiftSet = { id, name: inputValue, createdAt: Date.now(), tiers: [] };
    setGiftSets(prev => [newSet, ...prev]);
    setCurrentSetId(id);
    setIsPackageModalOpen(false);
    setInputValue('');
  };

  const handleDeleteSet = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('确定删除整个设计方案？')) {
      setGiftSets(prev => prev.filter(s => s.id !== id));
      if (currentSetId === id) setCurrentSetId(null);
    }
  };

  const handleOpenTierSettings = (tier?: Tier) => {
    if (tier) {
      setEditingTierId(tier.id);
      setTierForm({
        targetPrice: tier.targetTierPrice.toString(),
        discount: tier.discountRate.toString(),
        quantity: tier.quantity.toString(),
        box: tier.boxCost.toString(),
        labor: tier.laborCost.toString(),
        logistics: tier.logisticsCost.toString(),
        tax: tier.taxRate.toString()
      });
    } else {
      setEditingTierId(null);
      setTierForm({ targetPrice: '500', discount: '80', quantity: '100', box: '25', labor: '5', logistics: '15', tax: '6' });
    }
    setIsTierModalOpen(true);
  };

  const handleSaveTier = () => {
    if (!currentSetId) return;
    if (editingTierId) {
      setGiftSets(prev => prev.map(s => s.id === currentSetId ? {
        ...s,
        tiers: s.tiers.map(t => t.id === editingTierId ? {
          ...t,
          targetTierPrice: Number(tierForm.targetPrice),
          discountRate: Number(tierForm.discount),
          quantity: Number(tierForm.quantity),
          boxCost: Number(tierForm.box),
          laborCost: Number(tierForm.labor),
          logisticsCost: Number(tierForm.logistics),
          taxRate: Number(tierForm.tax),
          label: `${tierForm.targetPrice}元档`
        } : t)
      } : s));
    } else {
      const tid = Math.random().toString(36).substr(2, 9);
      const newTier: Tier = {
        id: tid,
        label: `${tierForm.targetPrice}元档`,
        targetTierPrice: Number(tierForm.targetPrice),
        discountRate: Number(tierForm.discount),
        quantity: Number(tierForm.quantity),
        boxCost: Number(tierForm.box),
        laborCost: Number(tierForm.labor),
        logisticsCost: Number(tierForm.logistics),
        taxRate: Number(tierForm.tax),
        selectedProductIds: []
      };
      setGiftSets(prev => prev.map(s => s.id === currentSetId ? { ...s, tiers: [...s.tiers, newTier] } : s));
      setActiveTierId(tid);
    }
    setIsTierModalOpen(false);
  };

  const addToTier = (pid: string) => {
    if (!currentSetId || !activeTierId) return;
    setGiftSets(prev => prev.map(s => s.id === currentSetId ? { ...s, tiers: s.tiers.map(t => t.id === activeTierId ? { ...t, selectedProductIds: [...t.selectedProductIds, pid] } : t) } : s));
    setLastAddedId(pid);
    setTimeout(() => setLastAddedId(null), 800);
  };

  const removeFromTier = (tid: string, idx: number) => {
    setGiftSets(prev => prev.map(s => s.id === currentSetId ? { ...s, tiers: s.tiers.map(t => {
      if (t.id === tid) {
        const next = [...t.selectedProductIds];
        next.splice(idx, 1);
        return { ...t, selectedProductIds: next };
      }
      return t;
    }) } : s));
  };

  const handleAIRecommendation = async () => {
    if (isAIThinking || products.length === 0 || !aiActiveTier) return;
    
    setIsAIThinking(true);
    setAIRecommendations([]);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const contextProducts = products.slice(0, 150).map(p => ({ id: p.id, name: p.name, retailPrice: p.retailPrice, category: p.category }));
      
      const prompt = `你是一个数字化礼赠选品专家。当前产品库有：${JSON.stringify(contextProducts)}。
目标档位预算：${aiActiveTier.targetTierPrice} 元。
产品折扣率：${aiActiveTier.discountRate}%。
客户特定需求："${aiRequirement || '寻找高性价比、美观的礼品组合'}"。

请基于以上产品推荐 8 个最匹配的单品，并根据其适配程度给出匹配度分值。
必须严格返回以下 JSON 格式：
{
  "recommendations": [
    {
      "productId": "必须是产品库中的真实ID",
      "reason": "推荐理由（20字以内）",
      "confidence": 0-100之间的整数（表示匹配度）
    }
  ]
}`;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              recommendations: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    productId: { type: Type.STRING },
                    reason: { type: Type.STRING },
                    confidence: { type: Type.INTEGER }
                  },
                  required: ["productId", "reason", "confidence"]
                }
              }
            }
          }
        }
      });
      
      const data = JSON.parse(response.text || '{}');
      if (data.recommendations) {
        const validRecs = data.recommendations
          .filter((r: any) => products.some(p => p.id === r.productId))
          .sort((a: any, b: any) => b.confidence - a.confidence);
        setAIRecommendations(validRecs);
      }
    } catch (error) { 
      console.error("AI Error:", error); 
      alert("AI 选品解析失败，请检查 API 配置。"); 
    } finally { 
      setIsAIThinking(false); 
    }
  };

  const applySingleRecommendation = (pid: string) => {
    addToTier(pid);
  };

  const applyAllRecommendations = () => {
    if (!aiActiveTier || aiRecommendations.length === 0) return;
    const ids = aiRecommendations.slice(0, 3).map(r => r.productId);
    setGiftSets(prev => prev.map(s => s.id === currentSetId ? { ...s, tiers: s.tiers.map(t => t.id === aiActiveTier.id ? { ...t, selectedProductIds: [...t.selectedProductIds, ...ids] } : t) } : s));
    setIsAIModalOpen(false);
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-[#FDFCF8] flex items-center justify-center p-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1579546678183-a9c101ad2c22?auto=format&fit=crop&q=80&w=2000')] opacity-5 grayscale pointer-events-none" />
        <div className="relative w-full max-w-md bg-white rounded-[48px] shadow-2xl border border-[#E5E1D1] p-12">
          <div className="text-center mb-10">
            <div className="inline-block bg-[#1B4332] p-2 rounded-3xl mb-6 shadow-xl overflow-hidden">
              <img src={LOGO_URL} alt="Logo" className="w-16 h-16 object-contain" />
            </div>
            <h1 className="text-4xl font-serif font-bold text-[#1B4332] mb-2 tracking-tight">藏镜山水</h1>
            <p className="text-[11px] text-[#B08D57] font-bold tracking-[0.2em] uppercase italic">数字化礼赠设计平台</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-6">
            <input type="text" placeholder="管理员账号" className="w-full px-6 py-4 bg-[#F9F7F2] border border-[#E5E1D1] rounded-[24px] outline-none" value={loginForm.username} onChange={(e) => setLoginForm({...loginForm, username: e.target.value})} />
            <input type="password" placeholder="安全密码" className="w-full px-6 py-4 bg-[#F9F7F2] border border-[#E5E1D1] rounded-[24px] outline-none" value={loginForm.password} onChange={(e) => setLoginForm({...loginForm, password: e.target.value})} />
            {loginError && <div className="text-red-500 text-xs font-bold pl-4">{loginError}</div>}
            <button type="submit" className="w-full py-5 bg-[#1B4332] text-white rounded-[24px] font-bold text-lg flex items-center justify-center gap-2"><LogIn size={20} /> 进入系统</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFCF8] text-[#1A1A1A] font-sans flex flex-col h-screen overflow-hidden">
      <header className="border-b border-[#E5E1D1] bg-white px-6 py-2 flex justify-between items-center z-50 shrink-0 shadow-sm">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => { setCurrentSetId(null); setActiveTierId(null); }}>
          <div className="bg-[#1B4332] p-1 rounded-lg shadow-md overflow-hidden shrink-0">
            <img src={LOGO_URL} alt="Logo" className="w-7 h-7 object-contain invert grayscale brightness-200" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-[#1B4332] font-serif leading-none">藏镜山水</h1>
            <p className="text-[9px] text-[#B08D57] font-bold mt-0.5 tracking-widest uppercase italic leading-none">数字化礼赠设计平台</p>
          </div>
        </div>
        <div className="flex gap-2">
          {currentSet && <button onClick={handleExportScheme} className="flex items-center gap-2 bg-[#F9F7F2] border border-[#E5E1D1] text-[#1B4332] px-4 py-1.5 rounded-full font-bold text-[10px]"><FileSpreadsheet size={12} /> 导出报表</button>}
          <button onClick={() => setIsLibraryModalOpen(true)} className="flex items-center gap-2 bg-[#F9F7F2] border border-[#E5E1D1] text-[#1B4332] px-4 py-1.5 rounded-full font-bold text-[10px]"><Database size={12} /> 产品库</button>
          <button onClick={handleLogout} className="flex items-center gap-2 bg-white border border-[#E5E1D1] text-gray-400 px-4 py-1.5 rounded-full font-bold text-[10px]">退出</button>
          <button onClick={() => { setInputValue(''); setIsPackageModalOpen(true); }} className="flex items-center gap-2 bg-[#1B4332] text-white px-5 py-1.5 rounded-full font-bold text-[10px] shadow-lg"><Plus size={12} /> 新方案</button>
        </div>
      </header>

      <main className="flex-1 flex overflow-hidden">
        {currentSet && (
          <aside className="w-[300px] border-r border-[#E5E1D1] bg-white flex flex-col shrink-0 z-20 shadow-xl">
            <div className="p-2.5 space-y-2 border-b border-[#F5F2E8]">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" size={12} />
                <input type="text" placeholder="搜索品名/SKU..." className="w-full pl-7 pr-3 py-1.5 bg-[#F9F7F2] border border-[#E5E1D1] rounded-lg text-xs outline-none" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
              </div>
              <FilterRow label="分类" icon={Layers} items={categories} activeItem={activeCategory} onSelect={setActiveCategory} />
            </div>
            <div className="flex-1 overflow-y-auto p-2.5 space-y-2 custom-scrollbar bg-[#FDFCF8]/30">
              {sortedFilteredProducts.map(p => {
                const isAIRec = aiRecommendations.some(r => r.productId === p.id);
                return (
                  <div 
                    key={p.id} 
                    onClick={() => activeTierId && addToTier(p.id)} 
                    className={`group relative bg-white border rounded-xl p-2 flex gap-2.5 cursor-pointer transition-all ${!activeTierId ? 'opacity-40 cursor-not-allowed' : 'hover:border-[#1B4332] shadow-sm'} ${lastAddedId === p.id ? 'ring-2 ring-[#1B4332]' : 'border-[#E5E1D1]'} ${isAIRec ? 'border-[#B08D57] bg-amber-50/30' : ''}`}
                  >
                    <ProductImage src={p.image} name={p.name} className="w-10 h-10 rounded-lg object-cover shrink-0 border" onHover={handleImageHover} />
                    <div className="flex-1 min-w-0 flex flex-col justify-center">
                      <div className="flex items-center gap-1 overflow-hidden">
                        <h4 className="text-[10px] font-bold text-[#1B4332] truncate leading-tight">{p.name}</h4>
                        {isAIRec && <Star size={8} className="text-[#B08D57] fill-[#B08D57] shrink-0" />}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <p className="text-[8px] text-[#B08D57] font-bold">零售: ¥{p.retailPrice}</p>
                        <p className="text-[8px] text-gray-400 font-bold bg-gray-100 px-1 rounded">采购: ¥{p.platformPrice}</p>
                      </div>
                    </div>
                    {isAIRec && <div className="absolute -top-1.5 -left-1.5 bg-[#B08D57] text-white text-[6px] px-1 rounded flex items-center gap-0.5 font-bold shadow-sm animate-pulse"><Zap size={6}/> AI推荐品</div>}
                    {activeTierId && <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity bg-[#1B4332] text-white p-0.5 rounded-full"><Plus size={10}/></div>}
                  </div>
                );
              })}
            </div>
          </aside>
        )}

        <section className="flex-1 bg-[#F9F7F2] overflow-y-auto p-6 relative custom-scrollbar">
          {!currentSet ? (
            <div className="max-w-6xl mx-auto py-10">
               <h2 className="text-2xl font-serif font-bold text-[#1B4332] mb-10 text-center">方案管理中心</h2>
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {giftSets.map(set => (
                  <div key={set.id} onClick={() => setCurrentSetId(set.id)} className="group bg-white rounded-[24px] border border-[#E5E1D1] p-6 shadow-sm hover:shadow-xl hover:border-[#1B4332] transition-all cursor-pointer relative overflow-hidden">
                    <button onClick={(e) => handleDeleteSet(set.id, e)} className="absolute top-3 right-3 p-1.5 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={14}/></button>
                    <h3 className="text-lg font-serif font-bold text-[#1B4332] group-hover:text-[#B08D57] transition-colors">{set.name}</h3>
                    <p className="text-[9px] text-gray-300 mt-3 uppercase tracking-wider">{new Date(set.createdAt).toLocaleDateString()} 创建</p>
                  </div>
                ))}
               </div>
            </div>
          ) : (
            <div className="max-w-full mx-auto min-h-full flex flex-col">
              <div className="flex justify-between items-center mb-6 shrink-0">
                <div className="flex items-center gap-4">
                  <button onClick={() => { setCurrentSetId(null); setActiveTierId(null); }} className="p-2 bg-white border rounded-xl hover:border-[#1B4332] shadow-sm transition-all"><ChevronLeft size={18}/></button>
                  <h2 className="text-2xl font-serif font-bold text-[#1B4332]">{currentSet.name}</h2>
                </div>
                <button onClick={() => handleOpenTierSettings()} className="bg-[#B08D57] text-white px-6 py-2 rounded-full font-bold shadow-lg flex items-center gap-2 hover:bg-[#A07C48] text-[11px] transition-all active:scale-95">
                  <Plus size={14} /> 新增策划档位
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                {currentSet.tiers.map(tier => {
                  const items = tier.selectedProductIds.map(id => products.find(p => p.id === id)).filter(Boolean) as Product[];
                  
                  const revenuePerUnit = tier.targetTierPrice;
                  const totalRetail = items.reduce((s, p) => s + p.retailPrice, 0); 
                  const discountRateDecimal = tier.discountRate / 100;
                  
                  // 整体折扣率 (营收价 / 零售总价)
                  const overallDiscountRate = totalRetail > 0 ? (revenuePerUnit / totalRetail) * 100 : 0;
                  
                  const productPresentationValue = totalRetail * discountRateDecimal; 
                  const totalPlatformPurchaseCost = items.reduce((s, p) => s + p.platformPrice, 0);
                  
                  // 统一核算逻辑：全额采购价核算
                  const calculatedProductCost = totalPlatformPurchaseCost;

                  const otherCosts = tier.boxCost + tier.laborCost + tier.logisticsCost;
                  const taxAmount = (productPresentationValue + otherCosts) * (tier.taxRate / 100);
                  
                  const totalUnitCost = calculatedProductCost + otherCosts + taxAmount;
                  const netProfit = revenuePerUnit - totalUnitCost;
                  const marginPercentage = revenuePerUnit > 0 ? (netProfit / revenuePerUnit) * 100 : 0;

                  const active = activeTierId === tier.id;

                  return (
                    <div key={tier.id} onClick={() => setActiveTierId(tier.id)} className={`bg-white rounded-[28px] border flex flex-col transition-all duration-300 relative overflow-hidden ${active ? 'border-[#1B4332] shadow-2xl ring-2 ring-[#1B4332]/10 scale-[1.02]' : 'border-[#E5E1D1] shadow-md hover:border-[#B08D57]'}`} style={{ minHeight: '620px' }}>
                      
                      <div className={`px-6 py-4 flex flex-col shrink-0 ${active ? 'bg-[#1B4332] text-white' : 'bg-[#FDFCF8] border-b'}`}>
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <p className="text-sm font-bold opacity-60 uppercase tracking-[0.1em]">{tier.quantity}套 规模</p>
                            <h3 className="text-2xl font-black font-serif">¥{tier.targetTierPrice} <span className="text-xs font-normal">预算档</span></h3>
                          </div>
                          <div className="flex gap-1.5 items-center">
                            <button onClick={(e) => { e.stopPropagation(); setAIActiveTier(tier); setIsAIModalOpen(true); }} className={`group relative px-4 py-2 rounded-xl transition-all flex items-center gap-2 font-bold text-[10px] overflow-hidden ${active ? 'bg-gradient-to-r from-amber-400 to-orange-500 text-[#1B4332] shadow-lg shadow-amber-500/30' : 'bg-white text-[#1B4332] border border-[#E5E1D1]'}`} title="AI选品解析">
                              <Sparkles size={14} className={active ? "animate-pulse" : ""} />
                              <span>AI 智能选品</span>
                              <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-500 skew-x-[-20deg]" />
                            </button>
                            <button onClick={(e) => { e.stopPropagation(); handleOpenTierSettings(tier); }} className={`p-2 rounded-xl transition-all ${active ? 'bg-white/10 hover:bg-white/20' : 'bg-gray-100 hover:bg-gray-200'}`} title="修改"><Settings size={14}/></button>
                            <button onClick={(e) => { e.stopPropagation(); if(confirm('删除此档位？')) setGiftSets(prev => prev.map(s => s.id === currentSetId ? { ...s, tiers: s.tiers.filter(t => t.id !== tier.id) } : s)); }} className={`p-2 rounded-xl transition-all ${active ? 'bg-red-500/30 hover:bg-red-500' : 'bg-red-50 text-red-500 hover:bg-red-100'}`} title="删除"><Trash2 size={14}/></button>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${active ? 'bg-white/20 text-white' : 'bg-[#B08D57]/10 text-[#B08D57]'}`}>
                            选品折率: {tier.discountRate}%
                          </span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${active ? 'bg-amber-100 text-[#1B4332]' : 'bg-[#1B4332] text-white shadow-sm'}`}>
                            <TrendingDown size={10} /> 整体折扣: {overallDiscountRate.toFixed(1)}%
                          </span>
                        </div>
                      </div>

                      <div className="h-[200px] overflow-y-auto p-4 space-y-2.5 custom-scrollbar bg-[#FDFCF8]/30 border-b shrink-0">
                        {items.length === 0 ? (
                          <div className="h-full flex flex-col items-center justify-center text-gray-300 opacity-60">
                             <Wand2 size={24} className="mb-2 text-[#B08D57] animate-bounce" />
                             <p className="text-xs font-bold tracking-widest uppercase">请从左侧添加或点击 AI 选品</p>
                          </div>
                        ) : items.map((it, idx) => (
                          <div key={idx} className="flex items-center gap-3 p-2.5 bg-white border border-gray-100 rounded-xl group/item shadow-sm hover:border-[#1B4332] transition-all">
                            <ProductImage src={it.image} name={it.name} className="w-10 h-10 rounded-lg object-cover border" onHover={handleImageHover} />
                            <div className="flex-1 min-w-0">
                               <p className="text-[11px] font-bold text-[#1B4332] truncate leading-tight">{it.name}</p>
                               <div className="flex gap-2 mt-1">
                                 <span className="text-[9px] text-gray-400">采购: ¥{it.platformPrice}</span>
                                 <span className="text-[9px] text-[#B08D57] font-bold">折后: ¥{(it.retailPrice * discountRateDecimal).toFixed(1)}</span>
                               </div>
                            </div>
                            <button onClick={(e) => { e.stopPropagation(); removeFromTier(tier.id, idx); }} className="opacity-0 group-hover/item:opacity-100 p-1 text-gray-300 hover:text-red-500 transition-all"><X size={14}/></button>
                          </div>
                        ))}
                      </div>

                      <div className="p-5 flex-1 flex flex-col justify-between bg-white overflow-hidden space-y-4">
                        <div className="space-y-4">
                          <div className="flex flex-wrap gap-4 items-center justify-between px-1">
                            <div className="text-left">
                               <p className="text-[8px] text-gray-400 font-bold uppercase tracking-tighter">折后展示价</p>
                               <p className="text-sm font-black text-[#1B4332]">¥{productPresentationValue.toFixed(1)}</p>
                            </div>
                            <div className="text-center">
                               <p className="text-[8px] text-gray-400 font-bold uppercase tracking-tighter">非折扣零售额</p>
                               <p className="text-sm font-bold text-gray-400 line-through">¥{totalRetail.toFixed(1)}</p>
                            </div>
                            <div className="text-right">
                               <p className="text-[8px] text-gray-400 font-bold uppercase tracking-tighter">全采购成本</p>
                               <p className="text-sm font-black text-[#1B4332]">¥{totalPlatformPurchaseCost.toFixed(1)}</p>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-x-4 gap-y-2 py-3 border-y border-gray-50">
                             <div className="flex justify-between text-[10px]"><span className="text-gray-400">核算基准:</span><span className="text-[#1B4332] font-black">采购成本</span></div>
                             <div className="flex justify-between text-[10px] pl-4 border-l border-gray-100"><span className="text-gray-400">整体折扣:</span><span className="text-[#B08D57] font-black">{overallDiscountRate.toFixed(1)}%</span></div>
                             <div className="flex justify-between text-[10px]"><span className="text-gray-400">预估税额:</span><span className="text-[#1B4332] font-black">¥{taxAmount.toFixed(1)}</span></div>
                             <div className="flex justify-between text-[10px] pl-4 border-l border-gray-100"><span className="text-gray-400">全成本:</span><span className="text-[#B08D57] font-black">¥{totalUnitCost.toFixed(1)}</span></div>
                          </div>

                          <div className="space-y-3">
                             <div className="grid grid-cols-2 gap-2">
                                <div className="bg-[#1B4332]/5 rounded-2xl border border-[#1B4332]/10 p-3 text-center shadow-inner">
                                   <p className="text-[8px] text-[#1B4332]/60 font-bold uppercase mb-1">单套预估净利</p>
                                   <p className={`text-xl font-black ${netProfit > 0 ? 'text-[#1B4332]' : 'text-red-500'}`}>¥{netProfit.toFixed(1)}</p>
                                </div>
                                <div className="bg-[#FDFCF8] rounded-2xl border border-gray-100 p-3 text-center shadow-inner">
                                   <p className="text-[8px] text-gray-400 font-bold uppercase mb-1">净利率</p>
                                   <p className="text-xl font-black text-[#1B4332]">{marginPercentage.toFixed(1)}%</p>
                                </div>
                             </div>
                             <div className="bg-[#1B4332]/5 rounded-xl p-2.5 flex items-start gap-2 border border-[#1B4332]/10">
                                <Info size={12} className="text-[#1B4332] shrink-0 mt-0.5" />
                                <p className="text-[9px] text-[#1B4332] leading-relaxed font-medium">
                                  财务核算已统一：系统当前强制按照“全额采购价”作为选品成本底线，不考虑折后展示价值。
                                </p>
                             </div>
                          </div>
                        </div>

                        <div className="pt-4 border-t border-gray-100 space-y-3">
                           <div className="flex justify-between items-end px-1">
                              <div className="text-left flex-1">
                                 <p className="text-[9px] text-[#B08D57] font-black uppercase tracking-tight mb-1">目标单套营收</p>
                                 <p className="text-3xl font-black text-[#1B4332] leading-none tracking-tighter">¥{revenuePerUnit}</p>
                              </div>
                           </div>
                           <div className="bg-[#1B4332] text-white rounded-2xl py-3 px-4 flex justify-between items-center shadow-xl">
                              <span className="text-[10px] font-bold uppercase tracking-widest opacity-80 flex items-center gap-2">
                                <Calculator size={14} /> 全案核算总投入
                              </span>
                              <span className="text-lg font-black">¥{(totalUnitCost * tier.quantity).toLocaleString()}</span>
                           </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </section>
      </main>

      {/* MODALS */}
      <Modal isOpen={isAIModalOpen} onClose={() => setIsAIModalOpen(false)} title="AI 专家选品解析" maxWidth="max-w-4xl">
        <div className="space-y-6">
          <div className="bg-[#FDFCF8] p-6 rounded-[32px] border border-[#E5E1D1] shadow-inner space-y-4">
            <div className="flex items-center gap-3 mb-1">
               <div className="p-3 bg-gradient-to-br from-[#1B4332] to-[#2D5A47] rounded-2xl text-white shadow-lg">
                  <BrainCircuit size={24} className="animate-pulse" />
               </div>
               <div>
                  <h4 className="text-sm font-bold text-[#1B4332] uppercase tracking-widest">智能选品工作台</h4>
                  <p className="text-[10px] text-[#B08D57] font-medium italic">基于神经网络检索，为您的客户定制最佳礼赠组合</p>
               </div>
            </div>
            <div className="flex gap-4">
              <textarea 
                placeholder="描述项目背景，如：某大型央企年会，需要宋韵风格礼品，倾向于茶器与文房组合，预算敏感..." 
                className="flex-1 h-32 px-5 py-4 bg-white border border-[#E5E1D1] rounded-[24px] outline-none text-xs resize-none shadow-sm focus:ring-4 focus:ring-[#1B4332]/5 transition-all placeholder:text-gray-300" 
                value={aiRequirement} 
                onChange={(e) => setAIRequirement(e.target.value)} 
              />
              <button 
                onClick={handleAIRecommendation} 
                disabled={isAIThinking || !aiRequirement.trim()} 
                className="w-32 bg-[#1B4332] text-white rounded-[24px] font-black flex flex-col items-center justify-center gap-3 transition-all active:scale-95 shadow-2xl disabled:opacity-50 disabled:scale-100 hover:bg-[#2D5A47] relative overflow-hidden group/btn"
              >
                {isAIThinking ? <Loader2 className="animate-spin" size={32} /> : <Sparkles size={40} className="text-amber-400 drop-shadow-lg group-hover/btn:scale-110 transition-transform" />}
                <span className="text-[11px] uppercase tracking-tighter">{isAIThinking ? '深度检索' : '开始智能解析'}</span>
                <div className="absolute inset-0 bg-white/10 opacity-0 group-hover/btn:opacity-100 transition-opacity" />
              </button>
            </div>
          </div>

          {aiRecommendations.length > 0 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-8 duration-700">
              <div className="flex items-center justify-between px-3">
                <div className="flex items-center gap-3">
                   <TrendingUp size={18} className="text-[#B08D57]"/>
                   <span className="text-xs font-bold text-[#1B4332] uppercase tracking-widest">推荐方案 (匹配度优先排序)</span>
                </div>
                <div className="flex gap-2">
                   <button onClick={applyAllRecommendations} className="px-4 py-1.5 bg-[#1B4332]/5 text-[#1B4332] border border-[#1B4332]/10 rounded-full text-[10px] font-bold hover:bg-[#1B4332] hover:text-white transition-all shadow-sm">一键采纳前三</button>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {aiRecommendations.map((rec, i) => {
                  const p = products.find(prod => prod.id === rec.productId);
                  if (!p) return null;
                  const scoreColor = rec.confidence >= 90 ? 'text-green-600 bg-green-50' : 'text-amber-600 bg-amber-50';
                  
                  return (
                    <div key={i} className="bg-white border border-[#E5E1D1] p-4 rounded-[24px] flex gap-4 group hover:border-[#1B4332] transition-all shadow-sm hover:shadow-xl relative overflow-hidden">
                      <div className={`absolute top-0 right-0 px-4 py-1.5 ${scoreColor} text-[10px] font-black rounded-bl-[20px] shadow-sm flex items-center gap-1`}>
                        <ThumbsUp size={10} /> {rec.confidence}% 匹配
                      </div>
                      <div className="relative shrink-0">
                         <ProductImage src={p.image} className="w-20 h-20 rounded-[20px] object-cover border" />
                         <button 
                            onClick={(e) => { e.stopPropagation(); applySingleRecommendation(p.id); }}
                            className="absolute -bottom-1 -right-1 bg-[#1B4332] text-white p-1.5 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                         >
                            <Plus size={14}/>
                         </button>
                      </div>
                      <div className="flex-1 min-w-0 pr-16 pt-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-bold text-sm text-[#1B4332] truncate">{p.name}</h4>
                        </div>
                        <div className="flex gap-2 mb-2">
                          <span className="text-[9px] px-1.5 py-0.5 bg-gray-50 border border-gray-100 rounded text-gray-400 font-bold uppercase">{p.category}</span>
                          <span className="text-[9px] text-[#B08D57] font-black">¥{p.retailPrice} 零售</span>
                        </div>
                        <p className="text-[10px] text-gray-500 leading-snug italic line-clamp-2 bg-gray-50/50 p-2 rounded-xl">"{rec.reason}"</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </Modal>

      <Modal isOpen={isTierModalOpen} onClose={() => setIsTierModalOpen(false)} title="档位财务参数核算模型设置" maxWidth="max-w-xl">
         <div className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
               <div className="col-span-2">
                 <label className="text-[10px] font-bold text-[#B08D57] block mb-2 uppercase tracking-widest">单套目标预算 (项目营收价)</label>
                 <input type="number" className="w-full px-5 py-4 bg-[#F9F7F2] border border-[#E5E1D1] rounded-2xl font-black text-2xl outline-none focus:ring-2 focus:ring-[#1B4332] shadow-inner" value={tierForm.targetPrice} onChange={(e) => setTierForm({...tierForm, targetPrice: e.target.value})} />
               </div>
               <div>
                 <label className="text-[10px] font-bold text-gray-400 block mb-2 uppercase tracking-widest">选品平均折率 (%)</label>
                 <input type="number" className="w-full px-5 py-3 bg-[#F9F7F2] border border-[#E5E1D1] rounded-xl text-sm font-bold" value={tierForm.discount} onChange={(e) => setTierForm({...tierForm, discount: e.target.value})} />
               </div>
               <div>
                 <label className="text-[10px] font-bold text-gray-400 block mb-2 uppercase tracking-widest">计划采购总数 (套)</label>
                 <input type="number" className="w-full px-5 py-3 bg-[#F9F7F2] border border-[#E5E1D1] rounded-xl text-sm font-bold" value={tierForm.quantity} onChange={(e) => setTierForm({...tierForm, quantity: e.target.value})} />
               </div>
            </div>
            <div className="p-5 bg-[#FDFCF8] rounded-2xl border border-dashed border-[#E5E1D1] space-y-4">
               <div className="grid grid-cols-3 gap-4">
                  <div><label className="text-[9px] text-gray-400 block mb-1 uppercase">包材单价</label><input type="number" className="w-full px-3 py-2 border rounded-xl text-xs font-bold" value={tierForm.box} onChange={(e) => setTierForm({...tierForm, box: e.target.value})} /></div>
                  <div><label className="text-[9px] text-gray-400 block mb-1 uppercase">人工单价</label><input type="number" className="w-full px-3 py-2 border rounded-xl text-xs font-bold" value={tierForm.labor} onChange={(e) => setTierForm({...tierForm, labor: e.target.value})} /></div>
                  <div><label className="text-[9px] text-gray-400 block mb-1 uppercase">物流单价</label><input type="number" className="w-full px-3 py-2 border rounded-xl text-xs font-bold" value={tierForm.logistics} onChange={(e) => setTierForm({...tierForm, logistics: e.target.value})} /></div>
               </div>
               <div className="flex items-center justify-between">
                 <label className="text-[9px] text-gray-400 uppercase font-bold">全案预估税率 (%)</label>
                 <input type="number" className="w-20 px-3 py-2 border rounded-xl text-xs font-bold" value={tierForm.tax} onChange={(e) => setTierForm({...tierForm, tax: e.target.value})} />
               </div>
            </div>
            <button onClick={handleSaveTier} className="w-full py-4 bg-[#1B4332] text-white rounded-2xl font-bold text-sm shadow-xl transition-all hover:opacity-90 active:scale-95">确认并应用最新核算模型</button>
         </div>
      </Modal>

      <Modal isOpen={isLibraryModalOpen} onClose={() => setIsLibraryModalOpen(false)} title="数字化产品库资源中心" maxWidth="max-w-[95vw]">
         <div className="flex flex-col h-[75vh] gap-4">
           <div className="flex gap-3 bg-[#F9F7F2] p-4 rounded-3xl border border-[#E5E1D1] shrink-0">
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="bg-[#1B4332] text-white px-6 py-3 rounded-2xl font-bold text-xs flex items-center gap-2 hover:bg-[#2D5A47] transition-all shadow-xl"
              >
                <FileUp size={16} /> 批量导入 CSV 数据 (UTF-8/GBK)
              </button>
              <input type="file" ref={fileInputRef} accept=".csv" className="hidden" onChange={handleFileUpload} />
              <button onClick={() => setProducts([{ id: Date.now().toString() + Math.random().toString(36).substr(2, 5), sku: 'NEW-'+Math.floor(Math.random()*1000), name: '待完善新选品', spec: '', unit: '件', platformPrice: 0, channelPrice: 0, retailPrice: 0, image: '', manufacturer: '', category: '默认' }, ...products])} className="bg-white border border-[#E5E1D1] text-[#1B4332] px-6 py-3 rounded-2xl font-bold text-xs hover:border-[#1B4332] transition-all shadow-sm">手动录入单品</button>
           </div>
           <div className="border border-[#E5E1D1] rounded-[28px] overflow-hidden bg-white shadow-inner flex-1 overflow-auto custom-scrollbar">
              <table className="w-full text-left border-collapse min-w-[1200px]">
                <thead className="bg-[#FDFCF8] text-[10px] font-bold text-[#B08D57] border-b sticky top-0 uppercase tracking-widest z-10 shadow-sm">
                  <tr><th className="px-6 py-4">SKU编码</th><th className="px-6 py-4">选品名称</th><th className="px-6 py-4">采购价 (成本)</th><th className="px-6 py-4">市场零售价</th><th className="px-6 py-4">分类/属性</th><th className="px-8 py-4 text-right">管理</th></tr>
                </thead>
                <tbody className="divide-y divide-[#F5F2E8]">
                  {products.map(p => (
                    <tr key={p.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-3"><input className="text-[11px] font-mono outline-none w-full bg-transparent" value={p.sku} onChange={(e) => setProducts(products.map(x => x.id === p.id ? {...x, sku: e.target.value} : x))} /></td>
                      <td className="px-6 py-3 flex gap-3 items-center"><ProductImage src={p.image} name={p.name} className="w-8 h-8 rounded-lg border" /><input className="font-bold text-[#1B4332] outline-none w-full text-xs bg-transparent" value={p.name} onChange={(e) => setProducts(products.map(x => x.id === p.id ? {...x, name: e.target.value} : x))} /></td>
                      <td className="px-6 py-3"><input type="number" className="px-3 py-1.5 border rounded-lg w-24 text-xs font-bold" value={p.platformPrice} onChange={(e) => setProducts(products.map(x => x.id === p.id ? {...x, platformPrice: Number(e.target.value)} : x))} /></td>
                      <td className="px-6 py-3"><input type="number" className="px-3 py-1.5 border rounded-lg w-24 text-xs font-bold" value={p.retailPrice} onChange={(e) => setProducts(products.map(x => x.id === p.id ? {...x, retailPrice: Number(e.target.value)} : x))} /></td>
                      <td className="px-6 py-3"><input className="text-xs outline-none w-full bg-transparent" value={p.category} onChange={(e) => setProducts(products.map(x => x.id === p.id ? {...x, category: e.target.value} : x))} /></td>
                      <td className="px-8 py-3 text-right">
                        <button onClick={() => { if(confirm('确认永久删除此选品？')) setProducts(products.filter(x => x.id !== p.id)); }} className="text-gray-200 hover:text-red-500 transition-colors"><Trash2 size={16}/></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
           </div>
         </div>
      </Modal>

      <Modal isOpen={isPackageModalOpen} onClose={() => setIsPackageModalOpen(false)} title="开启全新策划方案">
        <div className="space-y-4">
          <input autoFocus type="text" placeholder="输入客户或项目名称..." className="w-full px-6 py-5 bg-[#F9F7F2] border border-[#E5E1D1] rounded-[24px] outline-none font-bold text-xl shadow-inner focus:ring-2 focus:ring-[#1B4332]" value={inputValue} onChange={(e) => setInputValue(e.target.value)} />
          <button onClick={handleCreateSet} className="w-full py-5 bg-[#1B4332] text-white rounded-[24px] font-bold text-lg shadow-2xl active:scale-95 transition-all flex items-center justify-center gap-3">进入策划工作台</button>
        </div>
      </Modal>

      {hoveredImage && (
        <div className="fixed z-[3000] pointer-events-none shadow-2xl animate-in zoom-in-95" style={{ left: Math.min(hoveredImage.x + 20, window.innerWidth - 350), top: Math.min(hoveredImage.y + 20, window.innerHeight - 350), width: '320px', height: '320px' }}>
          <div className="w-full h-full bg-white p-3 rounded-[32px] border border-[#E5E1D1] overflow-hidden"><img src={hoveredImage.url} className="w-full h-full object-contain rounded-[24px]" alt="产品大图预览" /></div>
        </div>
      )}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Serif+SC:wght@700;900&family=Inter:wght@400;500;600;700;900&display=swap');
        body { font-family: 'Inter', sans-serif; background-color: #FDFCF8; -webkit-font-smoothing: antialiased; }
        .font-serif { font-family: 'Noto Serif SC', serif; }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; height: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #E5E1D1; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        
        @keyframes subtle-pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(0.98); }
        }
        .ai-pulse { animation: subtle-pulse 2s infinite ease-in-out; }
      `}</style>
    </div>
  );
}

const rootElement = document.getElementById('root');
if (rootElement) createRoot(rootElement).render(<App />);
