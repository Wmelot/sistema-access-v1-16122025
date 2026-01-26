import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useEffect, useRef, memo, useState } from "react"
import { TrendingUp, Settings2, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"

const AVAILABLE_SYMBOLS = {
    indices: [
        { s: "BMFBOVESPA:IBOV", d: "Ibovespa" },
        { s: "FX_IDC:USDBRL", d: "Dólar/Real" },
        { s: "FX_IDC:EURBRL", d: "Euro/Real" },
        { s: "FOREXCOM:SPXUSD", d: "S&P 500" },
        { s: "FOREXCOM:NSXUSD", d: "Nasdaq 100" },
    ],
    stocks: [
        { s: "NASDAQ:AAPL", d: "Apple" },
        { s: "NASDAQ:TSLA", d: "Tesla" },
        { s: "NASDAQ:MSFT", d: "Microsoft" },
        { s: "NASDAQ:NVDA", d: "NVIDIA" },
        { s: "BMFBOVESPA:PETR4", d: "Petrobras" },
        { s: "BMFBOVESPA:VALE3", d: "Vale" },
    ],
    crypto: [
        { s: "BINANCE:BTCUSDT", d: "Bitcoin" },
        { s: "BINANCE:ETHUSDT", d: "Ethereum" },
        { s: "BINANCE:SOLUSDT", d: "Solana" },
        { s: "BINANCE:BNBUSDT", d: "BNB" },
    ]
}

interface FinancialMarketWidgetProps {
    settings?: any
    onSettingsChange?: (settings: any) => void
}

function FinancialMarketWidgetComponent({ settings, onSettingsChange }: FinancialMarketWidgetProps) {
    const container = useRef<HTMLDivElement>(null);
    const [customSymbol, setCustomSymbol] = useState("");

    // Default settings if none provided
    const currentSettings = settings || {
        indices: ["BMFBOVESPA:IBOV", "FX_IDC:USDBRL", "FX_IDC:EURBRL"],
        stocks: ["NASDAQ:AAPL", "NASDAQ:TSLA"],
        crypto: ["BINANCE:BTCUSDT", "BINANCE:ETHUSDT"],
        custom: []
    }

    useEffect(() => {
        if (!container.current) return;
        container.current.innerHTML = "";

        const script = document.createElement("script");
        script.src = "https://s3.tradingview.com/external-embedding/embed-widget-market-overview.js";
        script.type = "text/javascript";
        script.async = true;

        const tabs = [];
        const getTabSymbols = (category: string, available: any[]) => {
            return available
                .filter(x => currentSettings[category]?.includes(x.s))
                .map(x => ({ s: x.s, d: x.d }));
        };

        if (currentSettings.indices?.length) {
            tabs.push({ title: "Índices", symbols: getTabSymbols('indices', AVAILABLE_SYMBOLS.indices) });
        }
        if (currentSettings.stocks?.length) {
            tabs.push({ title: "Ações", symbols: getTabSymbols('stocks', AVAILABLE_SYMBOLS.stocks) });
        }
        if (currentSettings.crypto?.length) {
            tabs.push({ title: "Cripto", symbols: getTabSymbols('crypto', AVAILABLE_SYMBOLS.crypto) });
        }
        if (currentSettings.custom?.length) {
            tabs.push({
                title: "Personalizados",
                symbols: currentSettings.custom.map((s: string) => ({ s, d: s.split(':')[1] || s }))
            });
        }

        script.innerHTML = JSON.stringify({
            "colorTheme": "light",
            "dateRange": "12M",
            "showChart": true,
            "locale": "br",
            "width": "100%",
            "height": "100%",
            "largeChartUrl": "",
            "isTransparent": false,
            "showSymbolLogo": true,
            "showFloatingTooltip": false,
            "plotLineColorGrowing": "rgba(41, 98, 255, 1)",
            "plotLineColorFalling": "rgba(41, 98, 255, 1)",
            "gridLineColor": "rgba(240, 243, 250, 0)",
            "scaleFontColor": "rgba(106, 109, 120, 1)",
            "belowLineFillColorGrowing": "rgba(41, 98, 255, 0.12)",
            "belowLineFillColorFalling": "rgba(41, 98, 255, 0.12)",
            "belowLineFillColorGrowingBottom": "rgba(41, 98, 255, 0)",
            "belowLineFillColorFallingBottom": "rgba(41, 98, 255, 0)",
            "symbolActiveColor": "rgba(41, 98, 255, 0.12)",
            "tabs": tabs
        });
        container.current.appendChild(script);
    }, [settings]);

    const toggleSymbol = (category: string, symbol: string) => {
        const categoryItems = currentSettings[category] || [];
        const next = categoryItems.includes(symbol)
            ? categoryItems.filter((s: string) => s !== symbol)
            : [...categoryItems, symbol];

        if (onSettingsChange) {
            onSettingsChange({ ...currentSettings, [category]: next });
        }
    };

    const addCustomSymbol = (specificSymbol?: string) => {
        const valueToUse = specificSymbol || customSymbol;
        if (!valueToUse) return;

        const symbol = valueToUse.toUpperCase().includes(':') ? valueToUse.toUpperCase() : `BMFBOVESPA:${valueToUse.toUpperCase()}`;

        // Prevent duplicates
        if (currentSettings.custom?.includes(symbol)) {
            setCustomSymbol("");
            return;
        }

        const nextCustom = [...(currentSettings.custom || []), symbol];

        if (onSettingsChange) {
            onSettingsChange({ ...currentSettings, custom: nextCustom });
        }
        setCustomSymbol("");
    };

    return (
        <Card className="h-full flex flex-col overflow-hidden">
            <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0 shrink-0">
                <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-blue-600" />
                    <CardTitle className="text-sm font-medium">Mercado Financeiro</CardTitle>
                </div>

                <Popover>
                    <PopoverTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                            <Settings2 className="h-4 w-4" />
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80 p-0" align="end">
                        <div className="p-4 border-b bg-slate-50/50">
                            <h4 className="font-semibold text-sm">Configurar Ativos</h4>
                            <p className="text-xs text-muted-foreground">Escolha o que deseja monitorar</p>

                            <div className="mt-3 relative">
                                <div className="flex gap-2">
                                    <input
                                        className="flex-1 text-xs px-2 py-1.5 border rounded bg-white outline-none focus:ring-1 ring-blue-500"
                                        placeholder="Ex: PETR4, ITUB4, BTC..."
                                        value={customSymbol}
                                        onChange={(e) => setCustomSymbol(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && addCustomSymbol()}
                                    />
                                    <Button size="sm" className="h-8 text-[10px]" onClick={() => addCustomSymbol()}>Adicionar</Button>
                                </div>

                                {/* Sugestões de Ativos */}
                                {customSymbol.length >= 1 && (
                                    <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border rounded-md shadow-lg max-h-48 overflow-y-auto">
                                        {[
                                            // Ações Brasileiras
                                            { s: "BMFBOVESPA:PETR4", d: "Petrobras" },
                                            { s: "BMFBOVESPA:VALE3", d: "Vale" },
                                            { s: "BMFBOVESPA:ITUB4", d: "Itaú Unibanco" },
                                            { s: "BMFBOVESPA:BBDC4", d: "Bradesco" },
                                            { s: "BMFBOVESPA:ABEV3", d: "Ambev" },
                                            { s: "BMFBOVESPA:MGLU3", d: "Magazine Luiza" },
                                            { s: "BMFBOVESPA:B3SA3", d: "B3" },
                                            // Cripto
                                            { s: "BINANCE:BTCUSDT", d: "BTC / Bitcoin" },
                                            { s: "BINANCE:ETHUSDT", d: "ETH / Ethereum" },
                                            { s: "BINANCE:SOLUSDT", d: "SOL / Solana" },
                                            { s: "BINANCE:DOGEUSDT", d: "DOGE / Dogecoin" },
                                            // USA
                                            { s: "NASDAQ:AAPL", d: "Apple" },
                                            { s: "NASDAQ:NVDA", d: "NVIDIA" },
                                            { s: "NASDAQ:TSLA", d: "Tesla" },
                                        ]
                                            .filter(x => x.s.toLowerCase().includes(customSymbol.toLowerCase()) || x.d.toLowerCase().includes(customSymbol.toLowerCase()))
                                            .map(suggestion => (
                                                <button
                                                    key={suggestion.s}
                                                    className="w-full text-left px-3 py-2 text-xs hover:bg-slate-50 border-b last:border-0 flex justify-between items-center"
                                                    onClick={() => addCustomSymbol(suggestion.s)}
                                                >
                                                    <span className="font-medium">{suggestion.d}</span>
                                                    <span className="text-[10px] text-zinc-400 font-mono">{suggestion.s.split(':')[1]}</span>
                                                </button>
                                            ))}
                                    </div>
                                )}
                            </div>
                        </div>
                        <ScrollArea className="h-[380px] overscroll-contain">
                            <div className="p-4 space-y-6 pb-20">
                                {Object.entries(AVAILABLE_SYMBOLS).map(([key, symbols]) => (
                                    <div key={key} className="space-y-3">
                                        <h5 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground border-l-2 border-blue-500 pl-2">{key === 'indices' ? 'Índices' : (key === 'stocks' ? 'Ações' : 'Cripto')}</h5>
                                        <div className="grid grid-cols-1 gap-1">
                                            {symbols.map(item => (
                                                <div key={item.s} className="flex items-center gap-2 hover:bg-slate-50 p-1.5 rounded transition-colors group">
                                                    <Checkbox
                                                        id={`symbol-${item.s}`}
                                                        checked={currentSettings[key]?.includes(item.s)}
                                                        onCheckedChange={() => toggleSymbol(key, item.s)}
                                                    />
                                                    <Label htmlFor={`symbol-${item.s}`} className="text-xs cursor-pointer flex-1 flex items-center justify-between">
                                                        <span>{item.d}</span>
                                                        <span className="text-[9px] text-zinc-400 font-mono">{item.s.split(':')[1]}</span>
                                                    </Label>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}

                                {currentSettings.custom?.length > 0 && (
                                    <div className="space-y-3">
                                        <h5 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground border-l-2 border-amber-500 pl-2">Favoritos</h5>
                                        <div className="grid grid-cols-1 gap-1">
                                            {currentSettings.custom.map((s: string) => (
                                                <div key={s} className="flex items-center gap-2 hover:bg-slate-50 p-1.5 rounded transition-colors group">
                                                    <Checkbox
                                                        id={`symbol-custom-${s}`}
                                                        checked={true}
                                                        onCheckedChange={() => toggleSymbol('custom', s)}
                                                    />
                                                    <Label htmlFor={`symbol-custom-${s}`} className="text-xs cursor-pointer flex-1 flex items-center justify-between">
                                                        <span>{s.split(':')[1] || s}</span>
                                                        <Button
                                                            variant="ghost"
                                                            className="h-4 w-4 p-0 text-red-500 hover:bg-red-50"
                                                            onClick={() => toggleSymbol('custom', s)}
                                                        >
                                                            ×
                                                        </Button>
                                                    </Label>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </ScrollArea>
                    </PopoverContent>
                </Popover>
            </CardHeader>
            <CardContent className="flex-1 p-0 min-h-0">
                <div className="tradingview-widget-container h-full w-full" ref={container}>
                    <div className="tradingview-widget-container__widget h-full w-full"></div>
                </div>
            </CardContent>
        </Card>
    );
}

export const FinancialMarketWidget = memo(FinancialMarketWidgetComponent)
