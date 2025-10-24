import { ThemeProvider } from "@/components/theme-provider";
import BookingApp from "./bookingapp";


export default function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      <BookingApp />
    </ThemeProvider>
  );
}
