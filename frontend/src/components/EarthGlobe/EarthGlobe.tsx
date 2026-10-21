import { useEffect, useRef } from "react";
import * as am5 from "@amcharts/amcharts5";
import * as am5map from "@amcharts/amcharts5/map";
import am4geodata_worldLow from "@amcharts/amcharts4-geodata/worldLow";
import am5themes_Animated from "@amcharts/amcharts5/themes/Animated";

export default function EarthGlobe() {
    const chartRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!chartRef.current) return;

        const root = am5.Root.new(chartRef.current);
        root.setThemes([am5themes_Animated.new(root)]);

        if (root._logo) {
            root._logo.set("visible", false);
        }

        const chart = root.container.children.push(
            am5map.MapChart.new(root, {
                panX: "none",
                panY: "none",
                projection: am5map.geoOrthographic(),
                paddingBottom: 10,
                paddingTop: 10,
                paddingLeft: 10,
                paddingRight: 10,
            })
        );

        const getThemeColors = () => {
            const styles = getComputedStyle(document.documentElement);
            return {
                ocean: styles.getPropertyValue("--color-globe-ocean").trim() || "#eaf2f8",
                land: styles.getPropertyValue("--color-globe-land").trim() || "#cdcaed",
            };
        };

        let colors = getThemeColors();

        const backgroundSeries = chart.series.push(am5map.MapPolygonSeries.new(root, {}));
        const bgTemplate = backgroundSeries.mapPolygons.template;
        bgTemplate.setAll({
            fill: am5.color(colors.ocean),
            fillOpacity: 0.45,
            strokeOpacity: 0,
        });
        backgroundSeries.data.push({ geometry: am5map.getGeoRectangle(90, 180, -90, -180) });

        const polygonSeries = chart.series.push(am5map.MapPolygonSeries.new(root, { geoJSON: am4geodata_worldLow }));
        const polyTemplate = polygonSeries.mapPolygons.template;
        polyTemplate.setAll({
            fill: am5.color(colors.land),
            fillOpacity: 0.85,
            stroke: am5.color(0xffffff),
            strokeWidth: 0.5,
            strokeOpacity: 0.6,
            interactive: false,
        });

        const rotationAnimation = chart.animate({
            key: "rotationX",
            from: 0,
            to: 360,
            duration: 30000,
            loops: Infinity,
            easing: am5.ease.linear
        });

        chart.appear(1000, 100);

        const observer = new MutationObserver(() => {
            const newColors = getThemeColors();
            bgTemplate.set("fill", am5.color(newColors.ocean));
            polyTemplate.set("fill", am5.color(newColors.land));
        });

        observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });

        return () => {
            observer.disconnect();
            if (rotationAnimation) rotationAnimation.stop();
            root.dispose();
        };
    }, []);

    return <div ref={chartRef} className="w-full h-full min-h-[300px] sm:min-h-[400px] md:min-h-[460px]" />;
}