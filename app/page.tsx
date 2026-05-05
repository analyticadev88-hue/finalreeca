// app.tsx
import { ThemeProvider } from "@/components/theme-provider";
import BookingApp from "./bookingapp";
import ComingSoon from "@/components/coming-soon";


import WhatsAppButton from "@/components/WhatsAppButton";


// ⚡ SIMPLE TOGGLE - Change this to false when ready to launch
const SHOW_COMING_SOON = false;

export default function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      {SHOW_COMING_SOON ? <ComingSoon /> : <BookingApp />}
      <WhatsAppButton />
    </ThemeProvider>
  );
}