// src/components/SEO/SEO.tsx
import { useEffect } from "react";

interface SEOProps {
    title: string;
    description?: string;
    noindex?: boolean;
}

export const SEO = ({ title, description, noindex = false }: SEOProps) => {
    useEffect(() => {
        document.title = `${title} | GeoGuessr`;

        if (description) {
            let metaDescription = document.querySelector('meta[name="description"]');
            if (!metaDescription) {
                metaDescription = document.createElement("meta");
                metaDescription.setAttribute("name", "description");
                document.head.appendChild(metaDescription);
            }
            metaDescription.setAttribute("content", description);
        }

        let metaRobots = document.querySelector('meta[name="robots"]');
        if (noindex) {
            if (!metaRobots) {
                metaRobots = document.createElement("meta");
                metaRobots.setAttribute("name", "robots");
                document.head.appendChild(metaRobots);
            }
            metaRobots.setAttribute("content", "noindex, nofollow");
        } else if (metaRobots) {
            metaRobots.remove();
        }
    }, [title, description, noindex]);

    return null;
};