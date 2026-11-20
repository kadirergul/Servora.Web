type FloorSoonPageProps = {
  title: string;
  description: string;
};

export function FloorSoonPage({ title, description }: FloorSoonPageProps) {
  return (
    <main className="floor-soon">
      <h1>{title}</h1>
      <p>{description}</p>
    </main>
  );
}
