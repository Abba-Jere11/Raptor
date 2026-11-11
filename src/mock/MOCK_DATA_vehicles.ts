/**
 * MOCK DATA FOR DESIGN ONLY. Never imported outside /prototype.
 * Vehicles are 3D stand-ins of one model, repainted (see public/stand-in/CREDITS.md).
 */
import { usd, type Money } from "@/lib/format";

export type VehicleStatus = "Draft" | "Awaiting CEO" | "Approved" | "Available" | "Reserved" | "Sold" | "Withdrawn";

export type MockVehicle = {
  id: string;
  slug: string;
  vin: string;
  year: number;
  make: string;
  model: string;
  body: string;
  price: Money;
  mileage: number;
  location: string;
  status: VehicleStatus;
  isNew: boolean;
  exportReady: boolean;
  titleStatus: "Clean" | "Rebuilt" | "Pending";
  fuel: string;
  transmission: string;
  drivetrain: string;
  engine: string;
  power: string;
  exterior: string;
  interior: string;
  image: string;
  photoCount: number;
  frames360: number;
  hasVideo: boolean;
  addedDaysAgo: number;
};

const base = {
  make: "Ferrari",
  model: "458 Spider",
  body: "Convertible",
  fuel: "Gasoline",
  transmission: "7-speed automatic",
  drivetrain: "RWD",
  engine: "4.5L V8 DOHC",
  power: "562 hp",
  titleStatus: "Clean" as const,
};

export const MOCK_VEHICLES: MockVehicle[] = [
  { ...base, id: "RA-0412", slug: "2013-ferrari-458-spider-ra-0412", vin: "ZFF67NFA2D0189186", year: 2013, price: usd(189500), mileage: 14200, location: "Miami, FL", status: "Available", isNew: true, exportReady: true, exterior: "Blu Tour de France", interior: "Cuoio", image: "/stand-in/car-34-blue.png", photoCount: 36, frames360: 36, hasVideo: true, addedDaysAgo: 3 },
  { ...base, id: "RA-0409", slug: "2014-ferrari-458-spider-ra-0409", vin: "ZFF68NHA5E0201144", year: 2014, price: usd(212000), mileage: 8900, location: "Houston, TX", status: "Available", isNew: true, exportReady: true, exterior: "Rosso Corsa", interior: "Nero", image: "/stand-in/car-34-red.png", photoCount: 30, frames360: 36, hasVideo: false, addedDaysAgo: 5 },
  { ...base, id: "RA-0405", slug: "2012-ferrari-458-spider-ra-0405", vin: "ZFF68NHA1C0187320", year: 2012, price: usd(176800), mileage: 21600, location: "Atlanta, GA", status: "Reserved", isNew: false, exportReady: false, exterior: "Argento Nürburgring", interior: "Nero", image: "/stand-in/car-34-silver.png", photoCount: 28, frames360: 0, hasVideo: false, addedDaysAgo: 22 },
  { ...base, id: "RA-0401", slug: "2015-ferrari-458-spider-ra-0401", vin: "ZFF68NHA9F0207718", year: 2015, price: usd(228900), mileage: 6300, location: "Newark, NJ", status: "Available", isNew: true, exportReady: true, exterior: "Bianco Avus", interior: "Cuoio", image: "/stand-in/car-34-white.png", photoCount: 32, frames360: 36, hasVideo: false, addedDaysAgo: 8 },
  { ...base, id: "RA-0398", slug: "2013-ferrari-458-spider-ra-0398", vin: "ZFF67NFA6D0190012", year: 2013, price: usd(194000), mileage: 17700, location: "Los Angeles, CA", status: "Awaiting CEO", isNew: false, exportReady: true, exterior: "Nero Daytona", interior: "Crema", image: "/stand-in/car-34-black.png", photoCount: 34, frames360: 36, hasVideo: false, addedDaysAgo: 1 },
  { ...base, id: "RA-0396", slug: "2014-ferrari-458-spider-ra-0396", vin: "ZFF68NHA3E0199841", year: 2014, price: usd(205500), mileage: 11100, location: "Dallas, TX", status: "Available", isNew: false, exportReady: true, exterior: "Blu Pozzi", interior: "Sabbia", image: "/stand-in/car-34-navy.png", photoCount: 29, frames360: 0, hasVideo: true, addedDaysAgo: 34 },
  { ...base, id: "RA-0393", slug: "2013-ferrari-458-spider-ra-0393", vin: "ZFF67NFA0D0186611", year: 2013, price: usd(199500), mileage: 9800, location: "Tampa, FL", status: "Available", isNew: false, exportReady: false, exterior: "Bronzo", interior: "Nero", image: "/stand-in/car-34-bronze.png", photoCount: 26, frames360: 0, hasVideo: false, addedDaysAgo: 41 },
  { ...base, id: "RA-0390", slug: "2015-ferrari-458-spider-ra-0390", vin: "ZFF68NHA7F0208802", year: 2015, price: usd(236000), mileage: 5200, location: "Seattle, WA", status: "Available", isNew: false, exportReady: true, exterior: "Grigio Silverstone", interior: "Rosso", image: "/stand-in/car-34-silver.png", photoCount: 31, frames360: 24, hasVideo: false, addedDaysAgo: 63 },
  { ...base, id: "RA-0387", slug: "2012-ferrari-458-spider-ra-0387", vin: "ZFF68NHA2C0185577", year: 2012, price: usd(171900), mileage: 25400, location: "Miami, FL", status: "Sold", isNew: false, exportReady: true, exterior: "Rosso Scuderia", interior: "Nero", image: "/stand-in/car-34-red.png", photoCount: 30, frames360: 0, hasVideo: false, addedDaysAgo: 95 },
  { ...base, id: "RA-0384", slug: "2014-ferrari-458-spider-ra-0384", vin: "ZFF68NHA8E0198420", year: 2014, price: usd(209000), mileage: 12800, location: "Houston, TX", status: "Draft", isNew: false, exportReady: false, exterior: "Blu Tour de France", interior: "Cuoio", image: "/stand-in/car-34-blue.png", photoCount: 4, frames360: 0, hasVideo: false, addedDaysAgo: 0 },
];

export const vehicleTitle = (v: MockVehicle) => `${v.year} ${v.make} ${v.model}`;

export const publicVehicles = MOCK_VEHICLES.filter((v) => ["Available", "Reserved", "Sold"].includes(v.status));

export const getVehicle = (slug: string) => MOCK_VEHICLES.find((v) => v.slug === slug);

/** Gallery for the vehicle page (Figure 6). One photo is a labelled flaw. */
export const MOCK_GALLERY = [
  { src: "/stand-in/car-34-blue.png", alt: "Front three-quarter view", flaw: null },
  { src: "/stand-in/car-side-2.png", alt: "Side profile", flaw: null },
  { src: "/stand-in/car-front-blue.png", alt: "Front view", flaw: null },
  { src: "/stand-in/car-rear34-blue.png", alt: "Rear three-quarter view", flaw: null },
  { src: "/stand-in/car-rear-blue.png", alt: "Rear view", flaw: "Minor scuff, rear bumper (left)" },
  { src: "/stand-in/car-top-blue.png", alt: "Top view, roof open", flaw: null },
  { src: "/stand-in/gallery-17.png", alt: "Studio view", flaw: null },
];

/** Frames for the prototype 360° viewer (simulated from available stand-in angles). */
export const MOCK_360_FRAMES = [
  "/stand-in/car-front-blue.png",
  "/stand-in/car-34-blue.png",
  "/stand-in/car-side-2.png",
  "/stand-in/car-rear34-blue.png",
  "/stand-in/car-rear-blue.png",
];

export const MOCK_VEHICLE_DETAIL = {
  overview:
    "A beautifully kept convertible with a documented history, inspected by our team on 9 October 2026. Exterior: a minor scuff on the rear bumper (photographed and labelled). Interior: clean. It drives as it should.",
  features: ["20-inch forged wheels", "Carbon-ceramic brakes", "Navigation and premium audio", "Full service history"],
  documents: [
    { name: "History report", visibility: "public" as const, detail: "[Provider] · 2 Oct 2026" },
    { name: "Inspection report", visibility: "public" as const, detail: "Completed 9 Oct 2026" },
    { name: "Title copy", visibility: "private" as const, detail: "Private: shared after payment" },
  ],
};
