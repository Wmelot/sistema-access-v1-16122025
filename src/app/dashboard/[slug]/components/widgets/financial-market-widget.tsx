
'use client'

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useEffect, useRef, memo } from "react"

function TradingViewWidgetComponent() {
    const container = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!container.current) return;

        // Clear previous scripts if any to prevent duplicates in dev strict mode
        container.current.innerHTML = "";

        const script = document.createElement("script");
        script.src = "https://s3.tradingview.com/external-embedding/embed-widget-market-overview.js";
        script.type = "text/javascript";
        script.async = true;
        script.innerHTML = JSON.stringify({
            "colorTheme": "light",
            "dateRange": "12M",
            "showChart": true,
            "locale": "br",
            "largeChartUrl": "",
            "isTransparent": false,
            "showSymbolLogo": true,
            "showFloatingTooltip": false,
            "width": "100%",
            "height": "100%", // Fit container
            "plotLineColorGrowing": "rgba(41, 98, 255, 1)",
            "plotLineColorFalling": "rgba(41, 98, 255, 1)",
            "gridLineColor": "rgba(240, 243, 250, 0)",
            "scaleFontColor": "rgba(106, 109, 120, 1)",
            "belowLineFillColorGrowing": "rgba(41, 98, 255, 0.12)",
            "belowLineFillColorFalling": "rgba(41, 98, 255, 0.12)",
            "belowLineFillColorGrowingBottom": "rgba(41, 98, 255, 0)",
            "belowLineFillColorFallingBottom": "rgba(41, 98, 255, 0)",
            "symbolActiveColor": "rgba(41, 98, 255, 0.12)",
            "tabs": [
                {
                    "title": "Índices",
                    "symbols": [
                        { "s": "BMFBOVESPA:IBOV" },
                        { "s": "FOREXCOM:SPXUSD" }, // S&P 500
                        { "s": "FOREXCOM:NSXUSD" } // Nasdaq
                    ],
                    "originalTitle": "Indices"
                },
                {
                    "title": "Câmbio",
                    "symbols": [
                        { "s": "FX_IDC:USDBRL" },
                        { "s": "FX_IDC:EURBRL" }
                    ],
                    "originalTitle": "Forex"
                }
            ]
        });
        container.current.appendChild(script);
    }, []); // Run once on mount

    return (
        <div className="tradingview-widget-container h-full w-full" ref={container}>
            <div className="tradingview-widget-container__widget h-full w-full"></div>
        </div>
    );
}

// Memo to prevent re-renders blowing up the iframe/script
export const FinancialMarketWidget = memo(TradingViewWidgetComponent)
