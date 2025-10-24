import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface PolicyModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode?: "admin" | "user";
  onAgree?: () => void; // Only for user mode
}

export function PolicyModal({ isOpen, onClose, mode = "user", onAgree }: PolicyModalProps) {
  const [policy, setPolicy] = useState("");
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [expanded, setExpanded] = useState(false); // For read more/less toggle

  useEffect(() => {
    if (isOpen) {
      fetch("/api/getpolicy")
        .then(res => res.json())
        .then(data => setPolicy(data.content));
    }
  }, [isOpen]);

  const handleSave = async () => {
    setSaving(true);
    await fetch("/api/updatepolicy", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: policy }),
    });
    setSaving(false);
    setEditing(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Terms &amp; Conditions / Policy</DialogTitle>
        </DialogHeader>
        <div className="mt-2">
          {mode === "admin" && editing ? (
            <textarea
              className="w-full min-h-[200px] border rounded p-2 text-sm"
              value={policy}
              onChange={e => setPolicy(e.target.value)}
              disabled={saving}
            />
          ) : (
            <>
              <div
                className={`whitespace-pre-line text-sm text-gray-700 bg-gray-50 rounded p-3 transition-all duration-300 ${
                  expanded ? "max-h-[400px]" : "max-h-[150px]"
                } overflow-y-auto`}
              >
                {policy}
              </div>
              {policy.length > 300 && ( // Show button only if content is long
                <Button
                  variant="ghost"
                  className="mt-2 text-[#009393] underline px-0"
                  onClick={() => setExpanded(!expanded)}
                >
                  {expanded ? "Read Less" : "Read More"}
                </Button>
              )}
            </>
          )}
        </div>
        <DialogFooter>
          {mode === "admin" ? (
            editing ? (
              <>
                <Button onClick={handleSave} disabled={saving} className="bg-[#009393] text-white">
                  {saving ? "Saving..." : "Save"}
                </Button>
                <Button variant="outline" onClick={() => setEditing(false)} disabled={saving}>
                  Cancel
                </Button>
              </>
            ) : (
              <Button onClick={() => setEditing(true)} className="bg-[#009393] text-white">
                Edit
              </Button>
            )
          ) : (
            <Button
              onClick={() => {
                if (onAgree) onAgree();
                onClose();
              }}
              className="bg-[#009393] text-white"
            >
              I Agree
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
