"use client";
import { useState, useEffect } from "react";

export default function PromotionsAdminPage() {
  const [promotions, setPromotions] = useState([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/promotions")
      .then(res => res.json())
      .then(data => setPromotions(data.promotions || []));
  }, []);

  const handleAdd = async () => {
    setLoading(true);
    await fetch("/api/promotions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, description }),
    });
    setTitle("");
    setDescription("");
    setLoading(false);
    // Refresh list
    const res = await fetch("/api/promotions");
    const data = await res.json();
    setPromotions(data.promotions || []);
  };

  const handleToggleActive = async (id: string, active: boolean) => {
    await fetch(`/api/promotions/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !active }),
    });
    const res = await fetch("/api/promotions");
    const data = await res.json();
    setPromotions(data.promotions || []);
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h2 className="text-xl font-bold mb-4">Manage Promotions</h2>
      <div className="mb-6">
        <input
          className="border p-2 mr-2"
          placeholder="Promotion Title"
          value={title}
          onChange={e => setTitle(e.target.value)}
        />
        <input
          className="border p-2 mr-2"
          placeholder="Promotion Description"
          value={description}
          onChange={e => setDescription(e.target.value)}
        />
        <button
          className="bg-teal-600 text-white px-4 py-2 rounded"
          onClick={handleAdd}
          disabled={loading}
        >
          Add Promotion
        </button>
      </div>
      <ul>
        {promotions.map((promo: any) => (
          <li key={promo.id} className="flex items-center justify-between border-b py-2">
            <div>
              <div className="font-semibold">{promo.title}</div>
              <div className="text-sm text-gray-600">{promo.description}</div>
            </div>
            <button
              className={`ml-4 px-3 py-1 rounded ${promo.active ? "bg-green-200" : "bg-gray-200"}`}
              onClick={() => handleToggleActive(promo.id, promo.active)}
            >
              {promo.active ? "Deactivate" : "Activate"}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}