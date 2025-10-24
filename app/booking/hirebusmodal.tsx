import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Bus, Loader2 } from "lucide-react";
import SuccessModal from "@/components/successhiremodal";

export default function HireBusModal({ onClose, onSubmit }: { onClose: () => void; onSubmit: (data: any) => Promise<void> }) {
  const [form, setForm] = useState({
    companyName: "",
    contactPerson: "",
    email: "",
    phone: "",
    passengers: "",
    date: "",
    time: "",
    origin: "",
    destination: "",
    returnDate: "",
    specialRequests: "",
  });

  const [loading, setLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await onSubmit(form);
      setShowSuccessModal(true);
      setForm({
        companyName: "",
        contactPerson: "",
        email: "",
        phone: "",
        passengers: "",
        date: "",
        time: "",
        origin: "",
        destination: "",
        returnDate: "",
        specialRequests: "",
      });
    } catch (error) {
      console.error("Error submitting form:", error);
    } finally {
      setLoading(false);
    }
  };

  const closeSuccessModal = () => {
    setShowSuccessModal(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex">
      <div
        className="bg-white shadow-xl rounded-r-2xl w-full max-w-md p-8 animate-slide-in-left overflow-y-auto"
        style={{
          minHeight: "100vh",
          maxHeight: "100vh",
          boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
        }}
      >
        <h2 className="text-2xl font-bold text-teal-900 mb-4">Inquire for Your Trip</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label className="text-gray-700">Company /Individual</Label>
            <Input
              name="companyName"
              value={form.companyName}
              onChange={handleChange}
              required
              className="text-gray-900 bg-white border border-gray-300"
            />
          </div>
          <div>
            <Label className="text-gray-700">Contact Person</Label>
            <Input
              name="contactPerson"
              value={form.contactPerson}
              onChange={handleChange}
              required
              className="text-gray-900 bg-white border border-gray-300"
            />
          </div>
          <div>
            <Label className="text-gray-700">Email</Label>
            <Input
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              required
              className="text-gray-900 bg-white border border-gray-300"
            />
          </div>
          <div>
            <Label className="text-gray-700">Phone</Label>
            <Input
              name="phone"
              value={form.phone}
              onChange={handleChange}
              required
              className="text-gray-900 bg-white border border-gray-300"
            />
          </div>
          <div>
            <Label className="text-gray-700">Number of Passengers</Label>
            <Input
              name="passengers"
              type="number"
              value={form.passengers}
              onChange={handleChange}
              required
              className="text-gray-900 bg-white border border-gray-300"
            />
          </div>
          <div>
            <Label className="text-gray-700">Depature Date</Label>
            <Input
              name="date"
              type="date"
              value={form.date}
              onChange={handleChange}
              required
              className="text-gray-900 bg-white border border-gray-300"
            />
          </div>
          <div>
            <Label className="text-gray-700">Time</Label>
            <Input
              name="time"
              type="time"
              value={form.time}
              onChange={handleChange}
              required
              className="text-gray-900 bg-white border border-gray-300"
            />
          </div>
          <div>
            <Label className="text-gray-700">Origin</Label>
            <Input
              name="origin"
              value={form.origin}
              onChange={handleChange}
              required
              className="text-gray-900 bg-white border border-gray-300"
            />
          </div>
          <div>
            <Label className="text-gray-700">Destination</Label>
            <Input
              name="destination"
              value={form.destination}
              onChange={handleChange}
              required
              className="text-gray-900 bg-white border border-gray-300"
            />
          </div>
          <div>
            <Label className="text-gray-700">Return Date</Label>
            <Input
              name="returnDate"
              type="date"
              value={form.returnDate}
              onChange={handleChange}
              className="text-gray-900 bg-white border border-gray-300"
            />
          </div>
          <div>
            <Label className="text-gray-700">Special Requests</Label>
            <Textarea
              name="specialRequests"
              value={form.specialRequests}
              onChange={handleChange}
              className="text-gray-900 bg-white border border-gray-300"
            />
          </div>
          <Button
            className="mt-6 w-full text-white"
            style={{ backgroundColor: '#FFD700' }}
            type="submit"
            disabled={loading}
          >
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {loading ? "Submitting..." : "Submit Inquiry"}
          </Button>

        </form>
        <Button variant="outline" className="mt-2 w-full bg-transparent text-teal-600 border-teal-600 hover:bg-teal-50" onClick={onClose} disabled={loading}>
          Cancel
        </Button>
      </div>
      {showSuccessModal && <SuccessModal onClose={closeSuccessModal} />}
      <div className="flex-1 bg-black bg-opacity-40" onClick={onClose} />
    </div>
  );
}
