import { FloorHeaderTools } from '@/layout/FloorHeaderTools';

type FloorSoonPageProps = {
  title: string;
  description: string;
};

export function FloorSoonPage({ title, description }: FloorSoonPageProps) {
  return (
    <>
      <header className="floor-header">
        <div className="floor-brand-block">
          <p className="floor-logo">SERVORA</p>
          <p className="floor-kicker">{title}</p>
        </div>
        <div className="floor-header-side">
          <FloorHeaderTools />
        </div>
      </header>
      <main className="floor-soon">
        <h1>{title}</h1>
        <p>{description}</p>
      </main>
    </>
  );
}
