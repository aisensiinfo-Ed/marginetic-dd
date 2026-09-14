import "./globals.css";

export const metadata = {
  title: "MargineticDD",
  description: "Technical due diligence, run on demand.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
