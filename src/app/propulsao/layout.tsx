import { Metadata } from 'next';
export const metadata: Metadata = {
  title: 'Propulsão Biomecânica | Palmilhas 3D',
  description: 'A tecnologia que revoluciona o tratamento de dores nos pés e joelhos.',
};
export default function PropulsaoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
