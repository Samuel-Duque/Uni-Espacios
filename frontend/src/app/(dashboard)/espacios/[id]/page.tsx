interface EspacioDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function EspacioDetailPage({ params }: EspacioDetailPageProps) {
  const { id } = await params;
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold tracking-tight">Ficha Técnica del Espacio #{id}</h1>
      <p className="text-muted-foreground mt-2">
        Consulta de inventario, disponibilidad horaria y solicitud de reserva.
      </p>
    </div>
  );
}
