import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { clusterPoints, googleMapsUrl, isSamePlace, STATUS_COLORS, type MapPoint } from "@/lib/catalogue/map";
import { PLACE_TYPE_OPTIONS, STATUS_OPTIONS, labelOf } from "@/lib/catalogue/types";

interface CatalogueMapProps {
  points: MapPoint[];
  onOpen: (id: string) => void;
  /** Un lieu attend d'être placé : un clic sur la carte choisit sa position. */
  placing: boolean;
  onPickPosition: (lat: number, lng: number) => void;
  /** Position proposée, montrée par un repère provisoire en attendant la confirmation. */
  preview: { lat: number; lng: number } | null;
  /** Un lieu à mettre en évidence (par exemple survolé dans la liste à côté de la carte). */
  highlightId?: string | null;
  /** Demande de se rendre sur un lieu et d'ouvrir sa fenêtre ; `nonce` change à chaque demande. */
  focus?: { id: string; nonce: number } | null;
}

const ISRAEL_CENTER: L.LatLngTuple = [31.5, 34.8];
const DEFAULT_ZOOM = 7;

function dotIcon(color: string): L.DivIcon {
  return L.divIcon({
    className: "",
    html: `<div style="width:18px;height:18px;border-radius:50%;background:${color};border:2.5px solid #fff;box-shadow:0 1px 5px rgba(0,0,0,.35)"></div>`,
    iconSize: [18, 18],
    iconAnchor: [9, 9],
    popupAnchor: [0, -10],
  });
}

function clusterIcon(count: number): L.DivIcon {
  return L.divIcon({
    className: "",
    html: `<div style="width:34px;height:34px;border-radius:50%;background:#1A1814;color:#fff;border:3px solid #fff;box-shadow:0 1px 6px rgba(0,0,0,.4);display:flex;align-items:center;justify-content:center;font:600 12px system-ui,sans-serif">${count}</div>`,
    iconSize: [34, 34],
    iconAnchor: [17, 17],
  });
}

const previewIcon = L.divIcon({
  className: "",
  html: `<div style="width:26px;height:26px;border-radius:50%;background:#ad1414;border:3px solid #fff;box-shadow:0 0 0 3px rgba(173,20,20,.35),0 2px 8px rgba(0,0,0,.4)"></div>`,
  iconSize: [26, 26],
  iconAnchor: [13, 13],
});

const highlightIcon = L.divIcon({
  className: "",
  html: `<div style="width:48px;height:48px;border-radius:50%;border:3px solid #1A1814;background:rgba(255,255,255,.35);box-shadow:0 0 0 3px rgba(255,255,255,.9),0 2px 10px rgba(0,0,0,.35)"></div>`,
  iconSize: [48, 48],
  iconAnchor: [24, 24],
});

function el<K extends keyof HTMLElementTagNameMap>(tag: K, text?: string, style?: string): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (text !== undefined) node.textContent = text; // textContent : jamais de HTML venant des données
  if (style) node.style.cssText = style;
  return node;
}

function openButton(label: string, onClick: () => void): HTMLButtonElement {
  const button = el(
    "button",
    label,
    "display:block;width:100%;margin-top:6px;padding:4px 10px;border-radius:4px;border:0;background:#1A1814;color:#fff;font-size:12px;cursor:pointer"
  );
  button.type = "button";
  button.addEventListener("click", onClick);
  return button;
}

/** Fenêtre d'un lieu, construite élément par élément (les noms viennent de sites et de légendes : jamais de HTML brut). */
function buildPlacePopup(point: MapPoint, onOpen: (id: string) => void): HTMLElement {
  const { entry } = point;
  const root = el("div", undefined, "min-width:180px;font-family:system-ui,sans-serif");
  root.appendChild(el("div", entry.display_name, "font-weight:600;font-size:13px;margin-bottom:2px;color:#1A1814"));
  const where = [labelOf(PLACE_TYPE_OPTIONS, entry.place_type), entry.display_city].filter(Boolean).join(" · ");
  if (where) root.appendChild(el("div", where, "font-size:11px;color:#666"));

  const status = el("div", undefined, "display:flex;align-items:center;gap:6px;margin-top:4px;font-size:11px;color:#444");
  status.appendChild(el("span", "", `width:9px;height:9px;border-radius:50%;background:${STATUS_COLORS[entry.commercial_status]};display:inline-block`));
  status.appendChild(el("span", labelOf(STATUS_OPTIONS, entry.commercial_status)));
  root.appendChild(status);

  root.appendChild(openButton("Ouvrir la fiche", () => onOpen(entry.id)));
  const maps = el("a", "Voir dans Google Maps", "display:block;margin-top:6px;font-size:11px;color:#1a56db");
  maps.href = googleMapsUrl(point.lat, point.lng);
  maps.target = "_blank";
  maps.rel = "noopener noreferrer";
  root.appendChild(maps);
  return root;
}

/** Fenêtre d'un groupe de lieux au même endroit, impossible à séparer en zoomant : on liste chaque lieu. */
function buildGroupPopup(items: MapPoint[], onOpen: (id: string) => void): HTMLElement {
  const root = el("div", undefined, "min-width:190px;font-family:system-ui,sans-serif");
  root.appendChild(el("div", `${items.length} lieux ici`, "font-weight:600;font-size:13px;color:#1A1814"));
  for (const item of items) {
    root.appendChild(openButton(item.entry.display_name, () => onOpen(item.entry.id)));
  }
  return root;
}

export function CatalogueMap({ points, onOpen, placing, onPickPosition, preview, highlightId = null, focus = null }: CatalogueMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layerRef = useRef<L.LayerGroup | null>(null);
  const previewRef = useRef<L.Marker | null>(null);
  const highlightRef = useRef<L.Marker | null>(null);
  const fittedRef = useRef<string>("");
  const [zoom, setZoom] = useState(DEFAULT_ZOOM);

  // Les gestionnaires de la carte sont posés une seule fois : ils lisent toujours la dernière version ici
  const latest = useRef({ placing, onPickPosition, onOpen, points });
  latest.current = { placing, onPickPosition, onOpen, points };

  // Création de la carte (une seule fois)
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = L.map(containerRef.current, { scrollWheelZoom: true }).setView(ISRAEL_CENTER, DEFAULT_ZOOM);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map);
    layerRef.current = L.layerGroup().addTo(map);
    map.on("zoomend", () => setZoom(map.getZoom()));
    map.on("click", (event: L.LeafletMouseEvent) => {
      if (latest.current.placing) latest.current.onPickPosition(event.latlng.lat, event.latlng.lng);
    });
    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
      layerRef.current = null;
      previewRef.current = null;
      highlightRef.current = null;
    };
  }, []);

  // Épingles et groupes : recalculés quand les lieux changent ou quand on zoome
  useEffect(() => {
    const map = mapRef.current;
    const layer = layerRef.current;
    if (!map || !layer) return;
    layer.clearLayers();

    const clusters = clusterPoints(points, (lat, lng) => map.project([lat, lng], zoom), zoom);
    for (const cluster of clusters) {
      if (cluster.items.length === 1) {
        const point = cluster.items[0];
        L.marker([point.lat, point.lng], { icon: dotIcon(STATUS_COLORS[point.entry.commercial_status]) })
          .bindPopup(buildPlacePopup(point, (id) => latest.current.onOpen(id)))
          .addTo(layer);
      } else {
        const marker = L.marker([cluster.lat, cluster.lng], { icon: clusterIcon(cluster.items.length) }).addTo(layer);
        if (isSamePlace(cluster.items) || zoom >= 16) {
          marker.bindPopup(buildGroupPopup(cluster.items, (id) => latest.current.onOpen(id)));
        } else {
          marker.on("click", () => {
            map.fitBounds(L.latLngBounds(cluster.items.map((p) => [p.lat, p.lng] as L.LatLngTuple)), {
              padding: [50, 50],
              maxZoom: 16,
            });
          });
        }
      }
    }
  }, [points, zoom]);

  // Cadrage : seulement quand l'ensemble des lieux affichés change, pas à chaque zoom
  useEffect(() => {
    const map = mapRef.current;
    if (!map || placing) return;
    const signature = points.map((p) => p.id).join(",");
    if (signature === fittedRef.current) return;
    fittedRef.current = signature;
    if (points.length === 0) return;
    map.fitBounds(L.latLngBounds(points.map((p) => [p.lat, p.lng] as L.LatLngTuple)), { padding: [40, 40], maxZoom: 12 });
  }, [points, placing]);

  // Repère provisoire de la position proposée
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (previewRef.current) {
      previewRef.current.remove();
      previewRef.current = null;
    }
    if (preview) {
      previewRef.current = L.marker([preview.lat, preview.lng], { icon: previewIcon, zIndexOffset: 1000 }).addTo(map);
      map.flyTo([preview.lat, preview.lng], Math.max(map.getZoom(), 14), { duration: 0.8 });
    }
  }, [preview]);

  // Mise en évidence d'un lieu (survol dans la liste), même s'il est caché dans un groupe d'épingles
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    highlightRef.current?.remove();
    highlightRef.current = null;
    const point = highlightId ? points.find((p) => p.id === highlightId) : null;
    if (point) {
      highlightRef.current = L.marker([point.lat, point.lng], { icon: highlightIcon, interactive: false, zIndexOffset: 900 }).addTo(map);
    }
  }, [highlightId, points]);

  // Aller sur un lieu : zoom au niveau de la rue, et sa fenêtre s'ouvre (« Ouvrir la fiche »...)
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !focus) return;
    const point = latest.current.points.find((p) => p.id === focus.id);
    if (!point) return;
    map.flyTo([point.lat, point.lng], Math.max(map.getZoom(), 16), { duration: 0.7 });
    L.popup({ offset: [0, -6] })
      .setLatLng([point.lat, point.lng])
      .setContent(buildPlacePopup(point, (id) => latest.current.onOpen(id)))
      .openOn(map);
  }, [focus]);

  // Curseur en croix quand on choisit une position. On agit sur le style du conteneur et jamais sur sa
  // classe : Leaflet y pose ses propres classes, une classe changée par React les effacerait.
  useEffect(() => {
    if (containerRef.current) containerRef.current.style.cursor = placing ? "crosshair" : "";
  }, [placing]);

  return (
    <div
      ref={containerRef}
      className="h-[65vh] min-h-[420px] w-full rounded-lg border border-border"
      role="application"
      aria-label="Carte des lieux du catalogue"
    />
  );
}
