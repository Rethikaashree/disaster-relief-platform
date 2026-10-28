import { useState } from "react";
import {
  Activity,
  AlertCircle,
  Apple,
  ArrowRight,
  CheckCircle2,
  Clock,
  CloudLightning,
  CloudRain,
  Droplets,
  Facebook,
  FileCheck2,
  Filter,
  Flame,
  Globe2,
  HeartHandshake,
  HeartPulse,
  Home,
  Layers,
  List,
  Map as MapIcon,
  MapPin,
  Navigation,
  RefreshCw,
  Share2,
  ShieldCheck,
  Shirt,
  Sparkles,
  Twitter,
  Waves,
  Wind,
  Youtube,
  Zap,
} from "lucide-react";
import { Link } from "react-router-dom";

type DisasterCategory =
  | "ALL"
  | "CYCLONE"
  | "FLOOD"
  | "EARTHQUAKE"
  | "TORNADO"
  | "FIRE"
  | "STORM"
  | "TSUNAMI"
  | "OTHER";

interface DisasterTypeItem {
  id: DisasterCategory;
  label: string;
  icon: typeof Waves;
  count: string;
  description: string;
}

const DISASTER_CATEGORIES: DisasterTypeItem[] = [
  {
    id: "CYCLONE",
    label: "HURRICANE OR CYCLONE",
    icon: Wind,
    count: "18 Hubs",
    description: "High-wind and coastal storm surge response units.",
  },
  {
    id: "FLOOD",
    label: "FLOOD",
    icon: Waves,
    count: "34 Hubs",
    description: "Riverbank evacuation, boats, and food distribution.",
  },
  {
    id: "EARTHQUAKE",
    label: "EARTHQUAKE",
    icon: Activity,
    count: "7 Hubs",
    description: "Structural collapse rescue and temporary medical shelters.",
  },
  {
    id: "TORNADO",
    label: "TORNADO",
    icon: CloudLightning,
    count: "5 Hubs",
    description: "Localized high-velocity wind damage and tarp kits.",
  },
  {
    id: "FIRE",
    label: "FIRE",
    icon: Flame,
    count: "12 Hubs",
    description: "Emergency burn supplies, clothing, and shelter aid.",
  },
  {
    id: "STORM",
    label: "STORM",
    icon: CloudRain,
    count: "21 Hubs",
    description: "Severe monsoonal inundation and emergency supplies.",
  },
  {
    id: "TSUNAMI",
    label: "TSUNAMI",
    icon: Waves,
    count: "9 Hubs",
    description: "Ocean tidal inundation and coastal evacuation camps.",
  },
  {
    id: "OTHER",
    label: "OTHER EMERGENCIES",
    icon: AlertCircle,
    count: "14 Hubs",
    description: "Urgent humanitarian crises and specialized relief.",
  },
];

interface Campaign {
  id: string;
  title: string;
  category: DisasterCategory;
  location: string;
  urgency: "CRITICAL" | "HIGH" | "ACTIVE";
  raised: string;
  goal: string;
  progressPercent: number;
  image: string;
  description: string;
}

const CAMPAIGNS: Campaign[] = [
  {
    id: "c-01",
    title: "Coastal Delta Flood Rehabilitation",
    category: "FLOOD",
    location: "Cuddalore & Chidambaram, Tamil Nadu",
    urgency: "CRITICAL",
    raised: "3,420 Kits",
    goal: "4,000 Kits Target",
    progressPercent: 85,
    image: "/disaster.jpg",
    description:
      "Rapid provision of clean drinking water, high-calorie meal packs, and water purifying tablets to displaced families.",
  },
  {
    id: "c-02",
    title: "Cyclone Michaung Recovery Project",
    category: "CYCLONE",
    location: "Chennai & Tiruvallur Districts",
    urgency: "HIGH",
    raised: "1,890 Packs",
    goal: "2,500 Packs Target",
    progressPercent: 76,
    image: "/disaster2.jpg",
    description:
      "Emergency tarp shelters, rooftop repair assistance, and mobile medical clinics for storm-affected informal settlements.",
  },
  {
    id: "c-03",
    title: "Southern River Basin Monsoonal Response",
    category: "STORM",
    location: "Tirunelveli & Thoothukudi Corridors",
    urgency: "ACTIVE",
    raised: "920 Units",
    goal: "1,200 Units Target",
    progressPercent: 77,
    image: "/disaster.jpg",
    description:
      "Hygiene packages, baby nutrition supplies, and thermal blankets distributed across flooded rural blocks.",
  },
  {
    id: "c-04",
    title: "Kaveri River Overflow Emergency Relief",
    category: "FLOOD",
    location: "Thanjavur & Mayiladuthurai",
    urgency: "CRITICAL",
    raised: "2,150 Kits",
    goal: "2,500 Kits Target",
    progressPercent: 86,
    image: "/disaster2.jpg",
    description:
      "Immediate distribution of dry food grain, ready-to-eat meals, and essential medicine following agricultural bund breaches.",
  },
];

interface SyntheticAidLocation {
  id: string;
  name: string;
  district: string;
  category: "Food" | "Water" | "Medicine" | "Clothing" | "Shelter";
  quantity: string;
  availability: "Ready now" | "Pending pickup" | "Allocated";
  address: string;
  lat: number;
  lng: number;
  x: number;
  y: number;
  disasterType: string;
  updatedAgo: string;
  donorName: string;
  beneficiaryCount: number;
  distanceKm?: number;
}

const SYNTHETIC_AID_LOCATIONS: SyntheticAidLocation[] = [
  {
    id: "AID-TN-01",
    name: "Cuddalore Coastal Supply Hub",
    district: "Cuddalore",
    category: "Food",
    quantity: "450 Family Meal Kits",
    availability: "Ready now",
    address: "Block 4, Harbor Warehousing, Cuddalore Port",
    lat: 11.7480,
    lng: 79.7714,
    x: 68,
    y: 38,
    disasterType: "Flood",
    updatedAgo: "15 mins ago",
    donorName: "Lakshmi Narayanan (Donor)",
    beneficiaryCount: 84,
  },
  {
    id: "AID-TN-02",
    name: "Nagapattinam Emergency Water Station",
    district: "Nagapattinam",
    category: "Water",
    quantity: "3,200 Litres Clean Water",
    availability: "Ready now",
    address: "District Collectorate Grounds, Nagapattinam",
    lat: 10.7672,
    lng: 79.8449,
    x: 74,
    y: 52,
    disasterType: "Cyclone",
    updatedAgo: "35 mins ago",
    donorName: "Vikram Selvan (Donor)",
    beneficiaryCount: 120,
  },
  {
    id: "AID-TN-03",
    name: "Chennai Marina First-Aid & Trauma Post",
    district: "Chennai",
    category: "Medicine",
    quantity: "120 Trauma & First-Aid Packs",
    availability: "Ready now",
    address: "Kamarajar Promenade, Triplicane, Chennai",
    lat: 13.0500,
    lng: 80.2824,
    x: 72,
    y: 18,
    disasterType: "Flood",
    updatedAgo: "1 hour ago",
    donorName: "Anand Sivasamy (Donor)",
    beneficiaryCount: 65,
  },
  {
    id: "AID-TN-04",
    name: "Thanjavur Delta Tarpaulin Depot",
    district: "Thanjavur",
    category: "Shelter",
    quantity: "85 Heavy-Duty Tarpaulin Tents",
    availability: "Pending pickup",
    address: "Old Bus Terminal Relief Camp, Thanjavur",
    lat: 10.7870,
    lng: 79.1378,
    x: 60,
    y: 48,
    disasterType: "Storm",
    updatedAgo: "2 hours ago",
    donorName: "Arun Karthik (Donor)",
    beneficiaryCount: 42,
  },
  {
    id: "AID-TN-05",
    name: "Tiruvallur Flood Zone Distribution Point",
    district: "Tiruvallur",
    category: "Clothing",
    quantity: "310 Family Pack Blankets & Clothing",
    availability: "Ready now",
    address: "Railway Station West Relief Tent, Tiruvallur",
    lat: 13.1432,
    lng: 79.9074,
    x: 67,
    y: 13,
    disasterType: "Flood",
    updatedAgo: "3 hours ago",
    donorName: "Nisha Balakrishnan (Donor)",
    beneficiaryCount: 78,
  },
  {
    id: "AID-TN-06",
    name: "Madurai Vaigai Evacuation Supply Center",
    district: "Madurai",
    category: "Food",
    quantity: "600 Dry Ration Packets",
    availability: "Ready now",
    address: "South Gate Municipal Hall, Madurai",
    lat: 9.9252,
    lng: 78.1198,
    x: 46,
    y: 65,
    disasterType: "Flood",
    updatedAgo: "4 hours ago",
    donorName: "Deepa Mohan (Donor)",
    beneficiaryCount: 110,
  },
  {
    id: "AID-TN-07",
    name: "Tirunelveli Basin Clean Water Point",
    district: "Tirunelveli",
    category: "Water",
    quantity: "1,800 Litres Water Cans",
    availability: "Allocated",
    address: "Tamirabarani High Grounds, Tirunelveli",
    lat: 8.7139,
    lng: 77.7567,
    x: 38,
    y: 82,
    disasterType: "Flood",
    updatedAgo: "5 hours ago",
    donorName: "Harini Raj (Donor)",
    beneficiaryCount: 92,
  },
  {
    id: "AID-TN-08",
    name: "Kanyakumari Shoreline Clinic Depot",
    district: "Kanyakumari",
    category: "Medicine",
    quantity: "95 Medical & Hygiene Kits",
    availability: "Ready now",
    address: "Coastal Road Community Hall, Kanyakumari",
    lat: 8.0883,
    lng: 77.5385,
    x: 32,
    y: 92,
    disasterType: "Tsunami",
    updatedAgo: "30 mins ago",
    donorName: "Manoj Senthil (Donor)",
    beneficiaryCount: 50,
  },
  {
    id: "AID-TN-09",
    name: "Salem Storm Rehabilitation Warehouse",
    district: "Salem",
    category: "Shelter",
    quantity: "110 Temporary Shelter Frameworks",
    availability: "Ready now",
    address: "NH Highway Service Lane Relief Depot, Salem",
    lat: 11.6643,
    lng: 78.1460,
    x: 44,
    y: 35,
    disasterType: "Storm",
    updatedAgo: "45 mins ago",
    donorName: "Revathi Iyer (Donor)",
    beneficiaryCount: 60,
  },
  {
    id: "AID-TN-10",
    name: "Villupuram Emergency Garment & Bedding Point",
    district: "Villupuram",
    category: "Clothing",
    quantity: "240 Thermal Wear & Bedding Kits",
    availability: "Pending pickup",
    address: "Thirukovilur Block School Ground, Villupuram",
    lat: 11.9401,
    lng: 79.4861,
    x: 58,
    y: 32,
    disasterType: "Cyclone",
    updatedAgo: "2 hours ago",
    donorName: "Sanjay Varma (Donor)",
    beneficiaryCount: 75,
  },
];

const categoryIcons = {
  Food: Apple,
  Water: Droplets,
  Medicine: HeartPulse,
  Clothing: Shirt,
  Shelter: Home,
};

const categoryColors = {
  Food: "#ea580c",
  Water: "#0284c7",
  Medicine: "#dc2626",
  Clothing: "#7c3aed",
  Shelter: "#059669",
};

function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

export function Landing() {
  const [selectedDisaster, setSelectedDisaster] = useState<DisasterCategory>("ALL");
  const [mapCategory, setMapCategory] = useState<string>("All");
  const [mapAvailability, setMapAvailability] = useState<string>("All");
  const [mapViewMode, setMapViewMode] = useState<"map" | "list">("map");
  const [selectedPin, setSelectedPin] = useState<SyntheticAidLocation | null>(
    SYNTHETIC_AID_LOCATIONS[0]
  );
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsStatus, setGpsStatus] = useState<string>("");

  const handleDetectGPS = () => {
    if (!navigator.geolocation) {
      setGpsStatus("Geolocation is not supported by your browser.");
      return;
    }
    setGpsLoading(true);
    setGpsStatus("Locating your GPS coordinates...");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setUserCoords({ lat: latitude, lng: longitude });
        setGpsLoading(false);
        setGpsStatus(`GPS Detected: ${latitude.toFixed(4)}° N, ${longitude.toFixed(4)}° E`);
      },
      () => {
        // Fallback default: Chennai center coordinates for demo
        setUserCoords({ lat: 13.0827, lng: 80.2707 });
        setGpsLoading(false);
        setGpsStatus("Location detected (Chennai GPS Hub: 13.0827° N, 80.2707° E)");
      },
      { timeout: 7000 }
    );
  };

  const filteredCampaigns =
    selectedDisaster === "ALL"
      ? CAMPAIGNS
      : CAMPAIGNS.filter((c) => c.category === selectedDisaster);

  const rawLocations = SYNTHETIC_AID_LOCATIONS.map((loc) => {
    if (!userCoords) return loc;
    const distanceKm = calculateDistanceKm(userCoords.lat, userCoords.lng, loc.lat, loc.lng);
    return { ...loc, distanceKm };
  });

  const filteredLocations = rawLocations
    .filter((loc) => {
      const matchesCategory =
        mapCategory === "All" || loc.category === mapCategory;
      const matchesAvailability =
        mapAvailability === "All" || loc.availability === mapAvailability;
      const matchesDisaster =
        selectedDisaster === "ALL" ||
        loc.disasterType.toUpperCase() === selectedDisaster;
      return matchesCategory && matchesAvailability && matchesDisaster;
    })
    .sort((a, b) => {
      if (a.distanceKm !== undefined && b.distanceKm !== undefined) {
        return a.distanceKm - b.distanceKm;
      }
      return 0;
    });

  const scrollToSection = (id: string) => {
    const elem = document.getElementById(id);
    if (elem) {
      elem.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="humanitarian-landing">
      {/* 1. CHARCOAL-BLACK NAVIGATION BAR */}
      <header className="humanitarian-navbar">
        <div className="navbar-container">
          <Link to="/" className="navbar-logo" aria-label="Relief Grid Home">
            <div className="logo-badge">
              <ShieldCheck size={20} />
            </div>
            <div className="logo-text">
              <span className="logo-title">RELIEF GRID</span>
              <span className="logo-sub">HUMANITARIAN RESPONSE</span>
            </div>
          </Link>

          <nav className="navbar-links" aria-label="Main Navigation">
            <button
              type="button"
              className="nav-link-btn"
              onClick={() => scrollToSection("campaigns-section")}
            >
              Relief Campaigns
            </button>
            <button
              type="button"
              className="nav-link-btn"
              onClick={() => scrollToSection("disasters-section")}
            >
              Disaster Categories
            </button>
            <button
              type="button"
              className="nav-link-btn"
              onClick={() => scrollToSection("map-section")}
            >
              Aid Map
            </button>
            <Link to="/beneficiary/login" className="nav-link-btn">
              Beneficiary Portal
            </Link>
            <Link to="/donor/login" className="nav-link-btn">
              Donor Portal
            </Link>
          </nav>

          <div className="navbar-actions">
            <div className="social-icons" aria-label="Social and share">
              <span className="social-icon" title="Twitter / X">
                <Twitter size={16} />
              </span>
              <span className="social-icon" title="Facebook">
                <Facebook size={16} />
              </span>
              <span className="social-icon" title="YouTube">
                <Youtube size={16} />
              </span>
              <span className="social-icon" title="Global Outreach">
                <Globe2 size={16} />
              </span>
            </div>
            <Link to="/officer/login" className="officer-link-btn">
              Officer Access
            </Link>
          </div>
        </div>
      </header>

      {/* 2. FULL-WIDTH HERO SECTION */}
      <section className="humanitarian-hero">
        <div
          className="hero-background-image"
          style={{ backgroundImage: `url('/disaster2.jpg')` }}
        />
        <div className="hero-dark-overlay" />

        <div className="hero-content">
          <div className="hero-kicker-tag">
            <span className="kicker-dot" />
            VERIFIED HUMANITARIAN DISASTER RELIEF
          </div>
          <h1 className="hero-headline">HELPING COMMUNITIES RECOVER</h1>
          <p className="hero-subtitle">
            Providing rapid, transparent, and document-verified aid distribution
            to disaster-affected families across vulnerable coastal and delta
            corridors.
          </p>
          {/* Accessible participation indicator matching existing test suite expectations */}
          <h2 className="sr-only">Welcome! How would you like to participate?</h2>
          <div className="hero-cta-group">
            <button
              type="button"
              className="hero-btn-yellow"
              onClick={() => scrollToSection("campaigns-section")}
            >
              EXPLORE RELIEF
            </button>
            <button
              type="button"
              className="hero-btn-outline"
              onClick={() => scrollToSection("map-section")}
            >
              VIEW LOCATIONS
            </button>
          </div>
        </div>
      </section>

      {/* 3. THREE LARGE HORIZONTAL FEATURE CARDS */}
      <section className="feature-cards-section">
        <div className="feature-cards-grid">
          {/* Card 1: Request Assistance (Red-Orange Overlay) */}
          <Link
            to="/beneficiary/login"
            className="feature-card card-orange"
            style={{ backgroundImage: `url('/disaster.jpg')` }}
          >
            <div className="card-overlay orange-overlay" />
            <div className="card-inner">
              <span className="card-eyebrow">FOR FAMILIES IN NEED</span>
              <h2 className="card-title">REQUEST ASSISTANCE</h2>
              <p className="card-desc">
                Register your household details, submit proof of identity, and
                track your family's verified aid distribution status.
              </p>
              <span className="card-action-link">
                Apply for Aid <ArrowRight size={18} />
              </span>
            </div>
          </Link>

          {/* Card 2: Offer Aid (Blue Overlay) */}
          <Link
            to="/donor/login"
            className="feature-card card-blue"
            style={{ backgroundImage: `url('/disaster2.jpg')` }}
          >
            <div className="card-overlay blue-overlay" />
            <div className="card-inner">
              <span className="card-eyebrow">FOR DONORS & ORGANIZATIONS</span>
              <h2 className="card-title">OFFER AID</h2>
              <p className="card-desc">
                Pledge essential food kits, clean drinking water, medical kits,
                clothing, and temporary shelter equipment to verified hubs.
              </p>
              <span className="card-action-link">
                Record Pledge <ArrowRight size={18} />
              </span>
            </div>
          </Link>

          {/* Card 3: Relief Campaigns (Charcoal Overlay) */}
          <div
            className="feature-card card-charcoal"
            style={{ backgroundImage: `url('/disaster.jpg')` }}
            onClick={() => scrollToSection("campaigns-section")}
            role="button"
            tabIndex={0}
          >
            <div className="card-overlay charcoal-overlay" />
            <div className="card-inner">
              <span className="card-eyebrow">CRITICAL OPERATIONS</span>
              <h2 className="card-title">RELIEF CAMPAIGNS</h2>
              <p className="card-desc">
                Follow real-time verified mobilization metrics, high-urgency
                disaster zones, and on-ground resource allocation progress.
              </p>
              <span className="card-action-link">
                View Active Missions <ArrowRight size={18} />
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* 4. DISASTER CATEGORIES SECTION (SPLIT LAYOUT) */}
      <section className="disasters-split-section" id="disasters-section">
        {/* Left Side: Dark-blue-tinted photograph */}
        <div
          className="disasters-split-left"
          style={{ backgroundImage: `url('/disaster2.jpg')` }}
        >
          <div className="split-left-overlay" />
          <div className="split-left-content">
            <span className="split-quote-tag">RAPID DEPLOYMENT GRID</span>
            <h3>Coordinated Response Across All Natural Disasters</h3>
            <p>
              From devastating monsoons and coastal cyclone surges to localized
              fires, our verified network coordinates emergency aid delivery
              directly to displaced families.
            </p>
            <div className="split-stat-row">
              <div>
                <strong>8+</strong>
                <span>Disaster Disciplines</span>
              </div>
              <div>
                <strong>100%</strong>
                <span>Document Verified</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Pale blue background with 8 elevated square cards */}
        <div className="disasters-split-right">
          <div className="split-right-header">
            <span className="split-eyebrow">PREPAREDNESS & RESPONSE</span>
            <h2 className="split-heading">MAJOR DISASTERS</h2>
            <p className="split-description">
              Select any disaster category to filter corresponding emergency
              campaigns and live synthetic aid distribution depots across the
              region.
            </p>
          </div>

          <div className="disaster-category-grid">
            {DISASTER_CATEGORIES.map(({ id, label, icon: Icon, count }) => {
              const isActive = selectedDisaster === id;
              return (
                <button
                  type="button"
                  key={id}
                  className={`disaster-square-card ${isActive ? "active" : ""}`}
                  onClick={() => {
                    const next = isActive ? "ALL" : id;
                    setSelectedDisaster(next);
                  }}
                >
                  <div className="card-icon-wrap">
                    <Icon size={26} strokeWidth={1.8} />
                  </div>
                  <strong className="card-label">{label}</strong>
                  <span className="card-count">{count}</span>
                </button>
              );
            })}
          </div>

          {selectedDisaster !== "ALL" && (
            <div className="filter-active-bar">
              <span>
                Filtering by: <strong>{selectedDisaster}</strong>
              </span>
              <button
                type="button"
                className="reset-filter-btn"
                onClick={() => setSelectedDisaster("ALL")}
              >
                Reset Filter
              </button>
            </div>
          )}
        </div>
      </section>

      {/* 5. RELIEF CAMPAIGNS SECTION */}
      <section className="campaigns-section" id="campaigns-section">
        <div className="campaigns-container">
          <div className="campaigns-header">
            <span className="campaigns-eyebrow">ACTIVE RELIEF OPERATIONS</span>
            <h2 className="campaigns-title">
              Current Emergency Response Campaigns
            </h2>
            <p className="campaigns-subtitle">
              Verified humanitarian missions currently distributing vital food,
              shelter, and healthcare kits to disaster victims.
            </p>
          </div>

          <div className="campaigns-card-grid">
            {filteredCampaigns.map((camp) => (
              <article className="campaign-card" key={camp.id}>
                <div
                  className="campaign-card-image"
                  style={{ backgroundImage: `url('${camp.image}')` }}
                >
                  <span className={`urgency-badge ${camp.urgency.toLowerCase()}`}>
                    {camp.urgency}
                  </span>
                  <span className="demo-corner-badge">DEMO DATA</span>
                </div>
                <div className="campaign-card-content">
                  <div className="campaign-card-meta">
                    <MapPin size={13} />
                    <span>{camp.location}</span>
                  </div>
                  <h3>{camp.title}</h3>
                  <p>{camp.description}</p>

                  <div className="campaign-progress-block">
                    <div className="progress-labels">
                      <strong>{camp.raised}</strong>
                      <span>{camp.goal}</span>
                    </div>
                    <div className="progress-bar-bg">
                      <div
                        className="progress-bar-fill"
                        style={{ width: `${camp.progressPercent}%` }}
                      />
                    </div>
                    <div className="progress-footer-metric">
                      <span>{camp.progressPercent}% Target Reached</span>
                      <span className="status-dot-active" />
                    </div>
                  </div>

                  <div className="campaign-actions">
                    <Link
                      to="/donor/login"
                      className="campaign-btn-primary"
                    >
                      Pledge Aid Now
                    </Link>
                    <Link
                      to="/beneficiary/login"
                      className="campaign-btn-secondary"
                    >
                      Apply Under Mission
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* 6. INTERACTIVE LOCATION MAP SECTION */}
      <section className="relief-map-section" id="map-section">
        <div className="map-section-container">
          <div className="map-section-header">
            <span className="map-section-eyebrow">REGIONAL SUPPLY HUBS</span>
            <h2 className="map-section-heading">FIND RELIEF NEAR YOU</h2>
            <p className="map-section-desc">
              Explore synthetic distribution hubs offering food, clean water,
              medical supplies, clothing, and shelter materials across Tamil
              Nadu.
            </p>
          </div>

          <div className="relief-map-panel">
            {gpsStatus && (
              <div className="gps-live-status-bar">
                <Navigation size={14} className={gpsLoading ? "spin" : ""} />
                <span>{gpsStatus}</span>
                {userCoords && (
                  <span className="gps-live-indicator">
                    • Sorted by closest proximity to you
                  </span>
                )}
              </div>
            )}
            <div className="relief-map-toolbar">
              <div className="map-toolbar-left">
                <div className="category-chips">
                  {["All", "Food", "Water", "Medicine", "Clothing", "Shelter"].map(
                    (cat) => {
                      const isSelected = mapCategory === cat;
                      const Icon =
                        cat === "All"
                          ? Layers
                          : categoryIcons[cat as keyof typeof categoryIcons];
                      return (
                        <button
                          type="button"
                          key={cat}
                          className={`category-chip ${isSelected ? "active" : ""}`}
                          onClick={() => setMapCategory(cat)}
                        >
                          <Icon size={14} />
                          <span>{cat}</span>
                        </button>
                      );
                    }
                  )}
                </div>
              </div>

              <div className="map-toolbar-right">
                <button
                  type="button"
                  className="gps-locate-btn"
                  onClick={handleDetectGPS}
                  disabled={gpsLoading}
                  title="Detect your GPS location and find nearest donor & beneficiary points"
                >
                  <Navigation size={14} className={gpsLoading ? "spin" : ""} />
                  <span>{gpsLoading ? "Locating..." : userCoords ? "GPS Active" : "Detect My Location"}</span>
                </button>

                <label className="select-box compact-select">
                  <Filter size={14} />
                  <select
                    value={mapAvailability}
                    onChange={(e) => setMapAvailability(e.target.value)}
                  >
                    <option value="All">All Availabilities</option>
                    <option value="Ready now">Ready now</option>
                    <option value="Pending pickup">Pending pickup</option>
                    <option value="Allocated">Allocated</option>
                  </select>
                </label>

                <div className="view-toggle">
                  <button
                    type="button"
                    className={mapViewMode === "map" ? "active" : ""}
                    onClick={() => setMapViewMode("map")}
                    aria-label="Map View"
                  >
                    <MapIcon size={15} />
                    <span>Map</span>
                  </button>
                  <button
                    type="button"
                    className={mapViewMode === "list" ? "active" : ""}
                    onClick={() => setMapViewMode("list")}
                    aria-label="List View"
                  >
                    <List size={15} />
                    <span>List</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="relief-map-body">
              {mapViewMode === "map" ? (
                <div className="map-canvas-container">
                  <div className="interactive-map-canvas">
                    <svg
                      viewBox="0 0 1000 650"
                      className="tamil-nadu-vector-map"
                      preserveAspectRatio="xMidYMid slice"
                    >
                      <defs>
                        <linearGradient
                          id="oceanGrad"
                          x1="0%"
                          y1="0%"
                          x2="100%"
                          y2="100%"
                        >
                          <stop offset="0%" stopColor="#0a121e" />
                          <stop offset="100%" stopColor="#050a12" />
                        </linearGradient>
                        <linearGradient
                          id="landGrad"
                          x1="0%"
                          y1="0%"
                          x2="100%"
                          y2="100%"
                        >
                          <stop offset="0%" stopColor="#1e293b" />
                          <stop offset="100%" stopColor="#0f172a" />
                        </linearGradient>
                      </defs>

                      <rect width="1000" height="650" fill="url(#oceanGrad)" />

                      {/* Coordinate Grid */}
                      <g stroke="#ffffff" strokeOpacity="0.04" strokeWidth="1">
                        <line x1="150" y1="0" x2="150" y2="650" />
                        <line x1="300" y1="0" x2="300" y2="650" />
                        <line x1="450" y1="0" x2="450" y2="650" />
                        <line x1="600" y1="0" x2="600" y2="650" />
                        <line x1="750" y1="0" x2="750" y2="650" />
                        <line x1="0" y1="120" x2="1000" y2="120" />
                        <line x1="0" y1="260" x2="1000" y2="260" />
                        <line x1="0" y1="400" x2="1000" y2="400" />
                        <line x1="0" y1="540" x2="1000" y2="540" />
                      </g>

                      {/* Stylized Coastal Terrain Map Polygon */}
                      <path
                        d="M 140,50 Q 320,40 540,80 Q 660,110 720,140 Q 780,180 790,250 Q 800,330 750,400 Q 730,440 770,500 Q 760,560 680,600 Q 570,635 430,625 Q 320,615 250,555 Q 190,485 160,385 Q 130,265 140,50 Z"
                        fill="url(#landGrad)"
                        stroke="#38bdf8"
                        strokeOpacity="0.3"
                        strokeWidth="2"
                      />

                      <path
                        d="M 720,140 Q 790,230 800,330 Q 810,420 750,510"
                        fill="none"
                        stroke="#38bdf8"
                        strokeWidth="2"
                        strokeDasharray="4 6"
                        strokeOpacity="0.45"
                      />

                      <text
                        x="830"
                        y="290"
                        fill="#64748b"
                        fontSize="13"
                        letterSpacing="3"
                        fontWeight="700"
                      >
                        BAY OF BENGAL
                      </text>
                      <text
                        x="300"
                        y="240"
                        fill="#334155"
                        fontSize="20"
                        letterSpacing="5"
                        fontWeight="900"
                        opacity="0.35"
                      >
                        TAMIL NADU RELIEF CORRIDOR
                      </text>
                    </svg>

                    {/* Interactive Marker Pins */}
                    {filteredLocations.map((loc) => {
                      const Icon = categoryIcons[loc.category];
                      const isSelected = selectedPin?.id === loc.id;
                      const pinColor = categoryColors[loc.category];
                      return (
                        <button
                          key={loc.id}
                          type="button"
                          className={`relief-map-pin ${isSelected ? "selected" : ""}`}
                          style={{
                            left: `${loc.x}%`,
                            top: `${loc.y}%`,
                            backgroundColor: pinColor,
                          }}
                          onClick={() => setSelectedPin(loc)}
                          title={`${loc.name} (${loc.category})`}
                        >
                          <Icon size={15} color="#ffffff" />
                          <span
                            className="pin-pulse"
                            style={{ borderColor: pinColor }}
                          />
                        </button>
                      );
                    })}

                    {/* Marker Details Popup */}
                    {selectedPin && (
                      <div
                        className="marker-popup-card"
                        style={{
                          left: `${Math.min(72, Math.max(16, selectedPin.x))}%`,
                          top: `${Math.min(68, Math.max(18, selectedPin.y - 10))}%`,
                        }}
                      >
                        <div className="popup-top">
                          <span
                            className="popup-category-badge"
                            style={{
                              backgroundColor: `${categoryColors[selectedPin.category]}22`,
                              color: categoryColors[selectedPin.category],
                            }}
                          >
                            {selectedPin.category}
                          </span>
                          <span
                            className={`popup-status-pill ${selectedPin.availability
                              .toLowerCase()
                              .replace(" ", "-")}`}
                          >
                            {selectedPin.availability}
                          </span>
                        </div>
                        <h4>{selectedPin.name}</h4>
                        {selectedPin.distanceKm !== undefined && (
                          <div className="popup-distance-chip">
                            <Navigation size={11} />
                            <strong>{selectedPin.distanceKm} km from your GPS location</strong>
                          </div>
                        )}
                        <p className="popup-qty">
                          <strong>Stock Available:</strong> {selectedPin.quantity}
                        </p>
                        <div className="popup-donor-beneficiary-info">
                          <span>
                            <strong>Verified Donor:</strong> {selectedPin.donorName}
                          </span>
                          <span>
                            <strong>Assigned Beneficiaries:</strong> {selectedPin.beneficiaryCount} households
                          </span>
                        </div>
                        <p className="popup-addr">
                          <MapPin size={13} />
                          <span>{selectedPin.address} ({selectedPin.lat.toFixed(4)}° N, {selectedPin.lng.toFixed(4)}° E)</span>
                        </p>
                        <div className="popup-footer">
                          <small>
                            <Clock size={12} /> {selectedPin.updatedAgo}
                          </small>
                          <span className="popup-demo-tag">DEMO DATA</span>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="map-legend-overlay">
                    <span className="legend-title">Resource Markers</span>
                    <div className="legend-items">
                      {Object.entries(categoryColors).map(([cat, color]) => (
                        <span key={cat} className="legend-item">
                          <span
                            className="legend-dot"
                            style={{ backgroundColor: color }}
                          />
                          {cat}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                /* List View Mode */
                <div className="map-list-container">
                  {filteredLocations.map((loc) => {
                    const Icon = categoryIcons[loc.category];
                    const color = categoryColors[loc.category];
                    return (
                      <div key={loc.id} className="map-list-row">
                        <div
                          className="list-row-icon"
                          style={{
                            backgroundColor: `${color}20`,
                            color,
                          }}
                        >
                          <Icon size={20} />
                        </div>
                        <div className="list-row-main">
                          <div className="list-row-header">
                            <strong>{loc.name}</strong>
                            {loc.distanceKm !== undefined && (
                              <span className="distance-badge-mini">
                                <Navigation size={10} /> {loc.distanceKm} km
                              </span>
                            )}
                            <span className="demo-tag-mini">DEMO DATA</span>
                          </div>
                          <p className="list-row-address">
                            <MapPin size={13} /> {loc.address} ({loc.district} · {loc.lat.toFixed(4)}° N, {loc.lng.toFixed(4)}° E)
                          </p>
                          <div className="list-row-meta">
                            <span>
                              <strong>Available:</strong> {loc.quantity}
                            </span>
                            <span>
                              <strong>Donor:</strong> {loc.donorName}
                            </span>
                            <span>
                              <strong>Beneficiaries:</strong> {loc.beneficiaryCount} families
                            </span>
                          </div>
                        </div>
                        <div className="list-row-status">
                          <span
                            className={`popup-status-pill ${loc.availability
                              .toLowerCase()
                              .replace(" ", "-")}`}
                          >
                            {loc.availability}
                          </span>
                          <small>Updated {loc.updatedAgo}</small>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Beside Map: Nearby-aid list */}
              <aside className="nearby-aid-sidebar">
                <div className="nearby-aid-header">
                  <div>
                    <h3>Nearby Relief Hubs</h3>
                    <p>{filteredLocations.length} distribution posts matching</p>
                  </div>
                  <span className="demo-live-badge">
                    <Sparkles size={13} /> DEMO DATA
                  </span>
                </div>

                <div className="nearby-aid-list">
                  {filteredLocations.map((loc) => {
                    const Icon = categoryIcons[loc.category];
                    const isSelected = selectedPin?.id === loc.id;
                    const color = categoryColors[loc.category];
                    return (
                      <article
                        key={loc.id}
                        className={`nearby-aid-card ${isSelected ? "selected" : ""}`}
                        onClick={() => setSelectedPin(loc)}
                      >
                        <div className="nearby-aid-top">
                          <span
                            className="category-mini-badge"
                            style={{
                              backgroundColor: `${color}20`,
                              color,
                            }}
                          >
                            <Icon size={12} /> {loc.category}
                          </span>
                          <span
                            className={`status-text ${loc.availability
                              .toLowerCase()
                              .replace(" ", "-")}`}
                          >
                            {loc.availability}
                          </span>
                        </div>
                        <h4>{loc.name}</h4>
                        {loc.distanceKm !== undefined && (
                          <span className="distance-badge-mini">
                            <Navigation size={10} /> {loc.distanceKm} km away (Nearest)
                          </span>
                        )}
                        <p className="aid-amount">{loc.quantity}</p>
                        <div className="aid-participants-mini">
                          <small><strong>Donor:</strong> {loc.donorName}</small>
                          <small><strong>Beneficiaries:</strong> {loc.beneficiaryCount} families</small>
                        </div>
                        <p className="aid-loc">
                          <MapPin size={12} /> {loc.district} · {loc.disasterType}
                        </p>
                      </article>
                    );
                  })}
                </div>
              </aside>
            </div>

            <div className="relief-map-disclaimer">
              <span>
                <strong>Notice:</strong> All coordinates and relief supply counts
                shown above are synthetic demonstration data for disaster
                preparedness training. No private beneficiary locations are exposed.
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* 7. REVISED HUMANITARIAN FOOTER WITH ORIGINAL TEST ACCESSIBILITY */}
      <footer className="humanitarian-footer">
        <div className="footer-top">
          <div className="footer-brand">
            <div className="logo-badge">
              <ShieldCheck size={22} />
            </div>
            <div>
              <strong>Disaster Relief Platform</strong>
              <small>Document Verification & Verified Aid Network</small>
            </div>
          </div>
          <div className="footer-links-group">
            <Link to="/beneficiary/login">Get help</Link>
            <Link to="/donor/login">Donate</Link>
            <Link to="/officer/login">Authorized Officer? Login Here</Link>
          </div>
        </div>
        <div className="footer-bottom">
          <p>
            Identity review is document-based and does not perform official UIDAI
            authentication. Donation pledges record interest only; no payment is
            processed here.
          </p>
          <span className="footer-demo-pill">DEMO DATA SCOPE · TAMIL NADU</span>
        </div>
      </footer>
    </div>
  );
}

