// frontend/src/app/(dashboard)/gestion/novedades/page.tsx
'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  AlertTriangle,
  UserCheck,
  UserX,
  Clock,
  Mail,
  Phone,
  CheckCircle2,
  Loader2,
  ShieldAlert,
  ClipboardCheck,
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';
import { verificacionesApi, usuariosApi, ApiError } from '../../../../lib/api';
import { queryKeys } from '../../../../lib/queryKeys';
import { useAuth } from '../../../../lib/auth-context';

export default function NovedadesGestionPage() {
  const { isGestor, isSuperAdmin } = useAuth();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);

  // Query: Reporte de Novedades de Inventario
  const {
    data: novedadesData,
    isLoading: isLoadingNovedades,
    error: novedadesError,
  } = useQuery({
    queryKey: queryKeys.novedades.all(page, 10),
    queryFn: () => verificacionesApi.getNovedades(page, 10),
    enabled: isGestor || isSuperAdmin,
  });

  // Mutación: Rehabilitar Usuario
  const rehabilitarMutation = useMutation({
    mutationFn: (usuarioId: number) => usuariosApi.rehabilitar(usuarioId),
    onSuccess: () => {
      toast.success('Usuario rehabilitado exitosamente. Ahora puede volver a solicitar reservas.');
      queryClient.invalidateQueries({ queryKey: queryKeys.novedades.all() });
      queryClient.invalidateQueries({ queryKey: queryKeys.reservas.all });
    },
    onError: (err: unknown) => {
      const msg = err instanceof ApiError ? err.message : 'Error al rehabilitar el usuario';
      toast.error(msg);
    },
  });

  if (!isGestor && !isSuperAdmin) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <ShieldAlert className="h-12 w-12 text-rose-500 mx-auto mb-3" />
        <h2 className="text-lg font-bold text-slate-800">Acceso Restringido</h2>
        <p className="text-xs text-slate-500 mt-1">
          Esta sección está reservada exclusivamente para Gestores de Espacio y Administradores.
        </p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Cabecera del Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
            Auditoría de Novedades de Inventario
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Actas de Check-Out con implementos dañados o faltantes y control de inhabilitaciones.
          </p>
        </div>

        {/* Navegación a Solicitudes */}
        <div className="flex items-center space-x-2">
          <Link
            href="/gestion/solicitudes"
            className="flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 shadow-2xs transition-all"
          >
            <ClipboardCheck className="h-4 w-4 text-emerald-700" />
            <span>Ver Bandeja de Solicitudes</span>
          </Link>
        </div>
      </div>

      {/* Listado de Novedades */}
      <div>
        {isLoadingNovedades ? (
          <div className="py-20 flex flex-col items-center justify-center text-slate-500 bg-white rounded-2xl border border-slate-200">
            <Loader2 className="h-8 w-8 animate-spin text-emerald-700 mb-3" />
            <span className="text-xs font-semibold">Consultando reportes de novedades...</span>
          </div>
        ) : novedadesError ? (
          <div className="p-6 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-center text-xs">
            Error al consultar el reporte de novedades.
          </div>
        ) : novedadesData?.data?.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 shadow-xs p-8">
            <CheckCircle2 className="h-10 w-10 text-emerald-600 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-slate-800">No hay novedades pendientes</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Todos los Check-Outs recientes han sido dictaminados conformes sin reportes de implementos dañados o extraviados.
            </p>
          </div>
        ) : (
          <div className="space-y-5">
            {novedadesData?.data?.map((reporte: any) => {
              const solicitante = reporte.reserva?.usuario;
              const isInhabilitado = solicitante?.inhabilitadoParaReservar;

              return (
                <div
                  key={reporte.id}
                  className="bg-white rounded-2xl border border-amber-300 shadow-xs overflow-hidden"
                >
                  {/* Cabecera del Caso */}
                  <div className="bg-amber-50/90 px-6 py-4 border-b border-amber-200 flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center space-x-2 flex-wrap">
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-amber-600 text-white uppercase tracking-wider">
                          Acta #{reporte.id}
                        </span>
                        <span className="text-xs font-bold text-slate-800">
                          Reserva #{reporte.reservaId} — {reporte.reserva?.espacio?.identificador || reporte.reserva?.espacio?.nombre}
                        </span>
                        <span className="text-xs text-slate-500">
                          (Bloque {reporte.reserva?.espacio?.bloque?.codigo}, Sede{' '}
                          {reporte.reserva?.espacio?.bloque?.sede?.nombre})
                        </span>
                      </div>
                      <div className="flex items-center space-x-3 text-[11px] text-slate-600 mt-1">
                        <span className="flex items-center space-x-1">
                          <Clock className="h-3 w-3" />
                          <span>
                            {format(new Date(reporte.fechaHora), "d 'de' MMMM, yyyy - HH:mm", {
                              locale: es,
                            })}
                          </span>
                        </span>
                        {reporte.verificador && (
                          <span>
                            Inspeccionado por: <strong>{reporte.verificador.nombreCompleto}</strong>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Estado del Usuario y Acción de Rehabilitación */}
                    <div className="flex items-center space-x-2 shrink-0">
                      {isInhabilitado ? (
                        <div className="flex items-center space-x-2">
                          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-300">
                            <UserX className="h-3.5 w-3.5" />
                            <span>Usuario Inhabilitado</span>
                          </span>

                          <button
                            type="button"
                            onClick={() => {
                              if (
                                confirm(
                                  `¿Deseas rehabilitar a ${solicitante.nombreCompleto} (${solicitante.email}) para que vuelva a solicitar reservas?`,
                                )
                              ) {
                                rehabilitarMutation.mutate(solicitante.id);
                              }
                            }}
                            disabled={rehabilitarMutation.isPending}
                            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 shadow-xs transition-colors"
                          >
                            <UserCheck className="h-3.5 w-3.5" />
                            <span>Rehabilitar Usuario</span>
                          </button>
                        </div>
                      ) : (
                        <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                          <span>Sanción Solventada</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Cuerpo: Solicitante e Implementos Afectados */}
                  <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Columna: Datos del Solicitante Responsable */}
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs space-y-2">
                      <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] text-slate-600">
                        Usuario Solicitante Responsable
                      </h4>
                      <div className="font-bold text-sm text-slate-900">
                        {solicitante?.nombreCompleto}
                      </div>
                      <div className="flex items-center space-x-1.5 text-slate-600">
                        <Mail className="h-3.5 w-3.5 text-slate-400" />
                        <span>{solicitante?.email}</span>
                      </div>
                      {solicitante?.documentoIdentidad && (
                        <div className="text-slate-600">
                          <strong>Documento:</strong> {solicitante.documentoIdentidad}
                        </div>
                      )}
                      {solicitante?.telefono && (
                        <div className="flex items-center space-x-1.5 text-slate-600">
                          <Phone className="h-3.5 w-3.5 text-slate-400" />
                          <span>{solicitante.telefono}</span>
                        </div>
                      )}
                      {solicitante?.motivoInhabilitacion && (
                        <div className="mt-2 pt-2 border-t border-slate-200 text-[11px] text-rose-800 bg-rose-50 p-2 rounded-lg">
                          <strong>Motivo registrado:</strong> {solicitante.motivoInhabilitacion}
                        </div>
                      )}
                    </div>

                    {/* Columna: Lista de Implementos Dañados o Faltantes */}
                    <div className="lg:col-span-2 space-y-3">
                      <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] text-slate-600">
                        Implementos con Novedad ({reporte.detalles?.length || 0})
                      </h4>

                      <div className="divide-y divide-slate-100 border rounded-xl overflow-hidden bg-white">
                        {reporte.detalles?.map((det: any) => (
                          <div
                            key={det.id}
                            className="p-3 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                          >
                            <div>
                              <div className="flex items-center space-x-2">
                                <span className="font-bold text-slate-900">
                                  {det.itemInventario?.nombre}
                                </span>
                                <span className="font-mono text-[10px] px-1.5 py-0.2 bg-slate-100 rounded text-slate-700">
                                  {det.itemInventario?.codigo}
                                </span>
                              </div>
                              <div className="mt-1 text-amber-900 bg-amber-50 p-1.5 rounded border border-amber-200 text-[11px]">
                                <strong>Observación de novedad:</strong>{' '}
                                {det.observacionNovedad || 'Sin detalle especificado'}
                              </div>
                            </div>

                            <div className="shrink-0 text-right">
                              <span
                                className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                  det.estadoItem === 'PRESENTE_DANADO'
                                    ? 'bg-amber-100 text-amber-800'
                                    : 'bg-rose-100 text-rose-800'
                                }`}
                              >
                                {det.estadoItem === 'PRESENTE_DANADO' ? 'Dañado' : 'Faltante'}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>

                      {reporte.observaciones && (
                        <div className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                          <strong>Observación General del Acta:</strong> {reporte.observaciones}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
