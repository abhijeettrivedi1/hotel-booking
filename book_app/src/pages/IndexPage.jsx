// IndexPage.jsx
import { Link } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import axios from "axios";

export default function IndexPage() {
  const [places, setPlaces] = useState([]);
  const [loading, setLoading] = useState(true);

  // filter state
  const [text, setText] = useState("");
  const [location, setLocation] = useState("");
  const [priceMin, setPriceMin] = useState("");
  const [priceMax, setPriceMax] = useState("");
  const [guests, setGuests] = useState("");
  const [perks, setPerks] = useState({
    wifi: false,
    pool: false,
    ac: false,
    parking: false,
  });

  // only price-based sorting allowed; empty string means 'no sort' (preserve original order)
  const [sortBy, setSortBy] = useState(""); // "" | price-asc | price-desc

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    axios
      .get("/places")
      .then((res) => {
        if (!cancelled) {
          setPlaces(res.data || []);
        }
      })
      .catch((err) => {
        console.error("Error fetching places:", err);
      })
      .finally(() => setLoading(false));
    return () => (cancelled = true);
  }, []);

  // build an array of active perks selected
  const selectedPerks = useMemo(
    () => Object.keys(perks).filter((k) => perks[k]),
    [perks]
  );

  // helper for a simple local relevance score (kept for filtering when text present)
  function relevanceScore(p, q) {
    const ql = q.toLowerCase();
    const title = (p.title || "").toString().toLowerCase();
    const addrFields = [];
    if (typeof p.address === "string") addrFields.push(p.address);
    else if (p.address && typeof p.address === "object") {
      addrFields.push(p.address.city || "", p.address.state || "", p.address.area || "");
    }
    const address = addrFields.join(" ").toLowerCase();
    const description = (p.description || "").toString().toLowerCase();

    let score = 0;

    // Title: strongest signal
    if (title.includes(ql)) {
      score += 0;
      score += Math.min(1, Math.max(0, title.indexOf(ql) / 100));
    } else {
      score += 3;
    }

    // Address: medium signal
    if (address.includes(ql)) {
      score += 1;
      score += Math.min(1, Math.max(0, address.indexOf(ql) / 200));
    } else {
      score += 4;
    }

    // Description: weaker signal
    if (description.includes(ql)) {
      score += 2;
      score += Math.min(1, Math.max(0, description.indexOf(ql) / 300));
    } else {
      score += 5;
    }

    // small boost for higher rated places
    score -= (Number(p.ratingAvg || 0) / 10);

    return score;
  }

  // filtering logic (substring matches, plus local relevance ordering when text present but only if no price sort)
  const filtered = useMemo(() => {
    if (!places || places.length === 0) return [];

    let base = places;

    // 1) text filter (substring search across fields)
    if (text) {
      const q = text.toLowerCase();
      base = base.filter((p) =>
        [
          p.title,
          typeof p.address === "string" ? p.address : [
            p.address?.city,
            p.address?.state,
            p.address?.area
          ].filter(Boolean).join(" "),
          p.description,
          (p.searchableText || ""),
        ]
          .filter(Boolean)
          .some((field) => field.toString().toLowerCase().includes(q))
      );
    }

    // 2) location filter (simple substring in city/address)
    if (location) {
      const q = location.toLowerCase();
      base = base.filter((p) =>
        [
          typeof p.address === "string" ? p.address : undefined,
          p.address?.city,
          p.address?.state,
          p.address?.area
        ]
          .filter(Boolean)
          .some((f) => f.toString().toLowerCase().includes(q))
      );
    }

    // 3) price filter
    const min = Number(priceMin) || 0;
    const max = priceMax === "" ? Infinity : Number(priceMax) || Infinity;
    if (priceMin || priceMax !== "") {
      base = base.filter((p) => {
        const price = Number(p.price || 0);
        return price >= min && price <= max;
      });
    }

    // 4) guests
    if (guests) {
      const g = Number(guests) || 1;
      base = base.filter((p) => Number(p.maxGuests || 1) >= g);
    }

    // 5) perks (all selected perks must be present)
    if (selectedPerks.length > 0) {
      base = base.filter((p) => {
        const placePerks = (p.perks || []).map((x) => x.toString().toLowerCase());
        return selectedPerks.every((sp) => placePerks.includes(sp.toLowerCase()));
      });
    }

    // 6) Sorting — ONLY price-based sorting is applied
    const sorted = [...base];

    if (sortBy === "price-asc") {
      sorted.sort((a, b) => Number(a.price || 0) - Number(b.price || 0));
    } else if (sortBy === "price-desc") {
      sorted.sort((a, b) => Number(b.price || 0) - Number(a.price || 0));
    } else {
      // no price sort requested — preserve original order.
      // However if user entered text and you want local relevance ordering when not sorting by price:
      if (text) {
        // local relevance ordering when user searched and didn't ask for a price sort
        const q = text;
        sorted.sort((a, b) => relevanceScore(a, q) - relevanceScore(b, q));
      }
    }

    return sorted;
  }, [places, text, location, priceMin, priceMax, guests, selectedPerks, sortBy]);

  const clearFilters = () => {
    setText("");
    setLocation("");
    setPriceMin("");
    setPriceMax("");
    setGuests("");
    setPerks({ wifi: false, pool: false, ac: false, parking: false });
    setSortBy("");
  };
  
  return (
    <div className="w-full px-4">
      
      {/* Top search + filters */}
      <div className="mt-6 mb-4 grid grid-cols-1 md:grid-cols-3 gap-3">

        {/* Short filters / sort (price only) */}
        <div className="flex gap-2 items-center">
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="border rounded-lg py-2 px-3">
            <option value="">Default</option>
            <option value="price-asc">Price: low → high</option>
            <option value="price-desc">Price: high → low</option>
          </select>
        </div>
      </div>

      {/* Advanced filter panel */}
      <div className="bg-white border rounded-lg p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm text-gray-600">Location (city or area)</label>
            <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g., Bangalore" className="w-full border rounded-md px-3 py-2 mt-1" />
          </div>

          <div>
            <label className="block text-sm text-gray-600">Price range (min)</label>
            <input value={priceMin} onChange={(e) => setPriceMin(e.target.value)} placeholder="0" type="number" min={0} className="w-full border rounded-md px-3 py-2 mt-1" />
          </div>

          <div>
            <label className="block text-sm text-gray-600">Price range (max)</label>
            <input value={priceMax} onChange={(e) => setPriceMax(e.target.value)} placeholder="Any" type="number" min={0} className="w-full border rounded-md px-3 py-2 mt-1" />
          </div>

          <div>
            <label className="block text-sm text-gray-600">Guests</label>
            <select value={guests} onChange={(e) => setGuests(e.target.value)} className="w-full border rounded-md px-3 py-2 mt-1">
              <option value="">Any</option>
              <option value="1">1</option>
              <option value="2">2</option>
              <option value="3">3</option>
              <option value="4">4</option>
              <option value="5">5+</option>
            </select>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-4 items-center">
          {/* perks checkboxes */}
          {["wifi", "pool", "ac", "parking"].map((p) => (
            <label key={p} className="inline-flex items-center gap-2">
              <input
                type="checkbox"
                checked={perks[p]}
                onChange={(e) => setPerks((prev) => ({ ...prev, [p]: e.target.checked }))}
                className="w-4 h-4"
              />
              <span className="capitalize text-sm">{p}</span>
            </label>
          ))}

          <div className="ml-auto flex gap-2">
            <button onClick={clearFilters} className="px-3 py-2 border rounded-md">Clear filters</button>
            <div className="px-3 py-2 rounded-md text-sm bg-gray-100">
              {filtered.length} results
            </div>
          </div>
        </div>
      </div>

      {/* Active filter chips */}
      <div className="mb-4 flex gap-2 flex-wrap">
        {text && <FilterChip label={`Search: "${text}"`} onClear={() => setText("")} />}
        {location && <FilterChip label={`Location: ${location}`} onClear={() => setLocation("")} />}
        {priceMin && <FilterChip label={`Min ₹${priceMin}`} onClear={() => setPriceMin("")} />}
        {priceMax && <FilterChip label={`Max ₹${priceMax}`} onClear={() => setPriceMax("")} />}
        {guests && <FilterChip label={`${guests} guests`} onClear={() => setGuests("")} />}
        {selectedPerks.map((p) => <FilterChip key={p} label={p} onClear={() => setPerks(prev => ({ ...prev, [p]: false }))} />)}
        {sortBy && <FilterChip label={`Sort: ${sortBy === "price-asc" ? "Price: low→high" : "Price: high→low"}`} onClear={() => setSortBy("")} />}
      </div>

      {/* Grid of results */}
      {loading ? (
        <div className="py-12 text-center text-gray-500">Loading places…</div>
      ) : filtered.length === 0 ? (
        <div className="py-12 text-center text-gray-500">No places found.</div>
      ) : (
        <div className="grid gap-x-6 gap-y-8 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {filtered.map((place) => (
            <Link key={place._id} to={`/place/${place._id}`} className="block transform transition duration-300 hover:scale-105">
              <div className="relative bg-gray-200 mb-4 rounded-xl overflow-hidden shadow-md hover:shadow-xl">
                {place.photos?.[0] ? (
                  <img className="w-full h-48 object-cover" src={place.photos[0]} alt={place.title} />
                ) : (
                  <div className="w-full h-48 flex items-center justify-center text-gray-500">No image</div>
                )}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-gray-900 to-transparent p-4">
                  <h2 className="text-white font-semibold text-lg truncate">{typeof place.address === 'string' ? place.address : (place.address?.city || place.address?.state || place.address?.area || "")}</h2>
                  <h3 className="text-gray-300 text-sm truncate">{place.title}</h3>
                </div>
              </div>

              <div className="flex justify-between items-center mt-2">
                <div>
                  <h2 className="text-gray-800 font-bold text-lg">{typeof place.address === 'string' ? place.address : (place.address?.city || place.address?.state || place.address?.area || "")}</h2>
                  <h3 className="text-gray-500 text-sm">{place.title}</h3>
                </div>
                <div className="text-right">
                  <span className="text-black-600 font-bold text-lg">₹{place.price}</span>
                  <span className="text-gray-600"> / night</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

/* small helper component for filter chips */
function FilterChip({ label, onClear }) {
  return (
    <div className="flex items-center gap-2 bg-gray-100 px-3 py-1 rounded-full text-sm">
      <span>{label}</span>
      <button onClick={onClear} className="text-xs px-1">✕</button>
    </div>
  );
}
