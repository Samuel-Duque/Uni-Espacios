// frontend/src/app/(dashboard)/gestion/solicitudes/page.tsx
'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ClipboardCheck,
  AlertTriangle,
  MapPin,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  ShieldAlert,
  Calendar,
  Filter,
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';
import { reservasApi, ApiError } from '../../../../lib/api';
import { queryKeys } from '../../../../lib/queryKeys';
import { useAuth } from '../../../../lib/auth-context';

export default function SolicitudesGestionPage() {
  const { isGestor, isSuperAdmin } = useAuth();
  const queryClient = useQueryClient();

  const [aprobacionesEstado, setAprobacionesEstado] = useState('PENDIENTE');

  // Modal para rechazar / dictaminar reserva
  const [dictamenModal, setDictamenModal] = useState<{
    isOpen: boolean;
    reservaId: number;
    accion: 'APROBADA' | 'RECHAZADA';
    observaciones: string;
  }>({
    isOpen: false,
    reservaId: 0,
    accion: 'APROBADA',
    observaciones: '',
  });

  // Query: Reservas de Gestión
  const {
    data: gestionData,
    isLoading: isLoadingGestion,
    error: gestionError,
  } = useQuery({
    queryKey: queryKeys.reservas.gestion({ estado: aprobacionesEstado || undefined }),
    queryFn: () => reservasApi.getGestion({ estado: aprobacionesEstado || undefined }),
    enabled: isGestor || isSuperAdmin,
  });

  // Mutación: Dictamen de Reserva (Aprobar / Rechazar)
  const dictamenMutation = useMutation({
    mutationFn: (payload: { id: number; estado: string; observaciones?: string }) =>
      reservasApi.cambiarEstado(payload.id, {
        estado: payload.estado,
        observaciones: payload.observaciones,
      }),
    onSuccess: (_, vars) => {
      toast.success(`Reserva #${vars.id} dictaminada como ${vars.estado}`);
      queryClient.invalidateQueries({ queryKey: queryKeys.reservas.all });
      setDictamenModal({ isOpen: false, reservaId: 0, accion: 'APROBADA', observaciones: '' });
    },
    onError: (err: unknown) => {
      const msg = err instanceof ApiError ? err.message : 'Error al dictaminar la reserva';
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
            Bandeja de Aprobación de Reservas
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Evaluación y dictamen de solicitudes institucionales radicadas por la comunidad académica.
          </p>
        </div>

        {/* Navegación a Novedades */}
        <div className="flex items-center space-x-2">
          <Link
            href="/gestion/novedades"
            className="flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 shadow-2xs transition-all"
          >
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <span>Ver Novedades de Inventario</span>
          </Link>
        </div>
      </div>

      {/* Barra de Filtro de Estado */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center space-x-2">
          <Filter className="h-4 w-4 text-slate-400" />
          <span className="text-xs font-bold text-slate-700">Estado de Solicitudes:</span>
        </div>

        <select
          value={aprobacionesEstado}
          onChange={(e) => setAprobacionesEstado(e.target.value)}
          className="text-xs font-semibold px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 shadow-xs outline-none focus:ring-2 focus:ring-emerald-600"
        >
          <option value="PENDIENTE">Pendientes de Dictamen</option>
          <option value="APROBADA">Aprobadas</option>
          <option value="EN_USO">En Uso Activo</option>
          <option value="FINALIZADA">Finalizadas</option>
          <option value="RECHAZADA">Rechazadas</option>
          <option value="">Todas las Solicitudes</option>
        </select>
      </div>

      {/* Listado de Solicitudes */}
      <div>
        {isLoadingGestion ? (
          <div className="py-20 flex flex-col items-center justify-center text-slate-500 bg-white rounded-2xl border border-slate-200">
            <Loader2 className="h-8 w-8 animate-spin text-emerald-700 mb-3" />
            <span className="text-xs font-semibold">Cargando solicitudes de reserva...</span>
          </div>
        ) : gestionError ? (
          <div className="p-6 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-center text-xs">
            Error al consultar la bandeja de aprobaciones.
          </div>
        ) : gestionData?.data?.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 shadow-xs p-8">
            <ClipboardCheck className="h-10 w-10 text-slate-300 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-slate-800">No hay solicitudes</h3>
            <p className="text-xs text-slate-500 mt-1">
              No hay reservas para dictaminar con el filtro de estado actual.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {gestionData?.data?.map((reserva: any) => (
              <div
                key={reserva.id}
                className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 hover:border-slate-300 transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-4"
              >
                <div className="space-y-2">
                  <div className="flex items-center space-x-2 flex-wrap">
                    <span className="text-xs font-mono font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                      Reserva #{reserva.id}
                    </span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                        reserva.estado === 'PENDIENTE'
                          ? 'bg-amber-100 text-amber-800'
                          : reserva.estado === 'APROBADA'
                            ? 'bg-sky-100 text-sky-800'
                            : reserva.estado === 'EN_USO'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {reserva.estado}
                    </span>
                    <span className="text-xs text-slate-500">
                      Solicitante: <strong>{reserva.usuario?.nombreCompleto}</strong> ({reserva.usuario?.email}) — {reserva.usuario?.rol}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-slate-900">
                    {reserva.espacio?.identificador || reserva.espacio?.nombre}
                  </h3>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600">
                    <div className="flex items-center space-x-1">
                      <MapPin className="h-3.5 w-3.5 text-slate-400" />
                      <span>
                        Bloque {reserva.espacio?.bloque?.codigo} — Sede{' '}
                        {reserva.espacio?.bloque?.sede?.nombre}
                      </span>
                    </div>
                    <div className="flex items-center space-x-1 font-medium">
                      <Clock className="h-3.5 w-3.5 text-slate-400" />
                      <span>
                        {format(new Date(reserva.fechaInicio), "d 'de' MMMM, yyyy", {
                          locale: es,
                        })}{' '}
                        | {format(new Date(reserva.fechaInicio), 'HH:mm')} -{' '}
                        {format(new Date(reserva.fechaFin), 'HH:mm')}
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-500 italic">
                    <strong>Motivo:</strong> {reserva.motivo}
                  </p>
                </div>

                {/* Acciones de Aprobación */}
                {reserva.estado === 'PENDIENTE' && (
                  <div className="flex items-center space-x-2 pt-2 lg:pt-0 shrink-0">
                    <button
                      type="button"
                      onClick={() =>
                        setDictamenModal({
                          isOpen: true,
                          reservaId: reserva.id,
                          accion: 'APROBADA',
                          observaciones: '',
                        })
                      }
                      className="flex items-center space-x-1 px-4 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl shadow-xs transition-colors"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      <span>Aprobar Reserva</span>
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        setDictamenModal({
                          isOpen: true,
                          reservaId: reserva.id,
                          accion: 'RECHAZADA',
                          observaciones: '',
                        })
                      }
                      className="flex items-center space-x-1 px-4 py-2 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-xl transition-colors border border-rose-200"
                    >
                      <XCircle className="h-4 w-4" />
                      <span>Rechazar</span>
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal de Dictamen (Aprobar / Rechazar) */}
      {dictamenModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-150">
            <h3 className="text-base font-bold text-slate-900 mb-2">
              {dictamenModal.accion === 'APROBADA'
                ? 'Aprobar Solicitud de Reserva'
                : 'Rechazar Solicitud de Reserva'}
            </h3>

            <p className="text-xs text-slate-600 mb-4">
              {dictamenModal.accion === 'APROBADA'
                ? 'El sistema validará de forma atómica y serializable la disponibilidad horaria antes de confirmar la aprobación.'
                : 'Debes proporcionar una justificación obligatoria (mínimo 5 caracteres) detallando el motivo del rechazo.'}
            </p>

            <div className="space-y-2 mb-4">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700">
                Observaciones {dictamenModal.accion === 'RECHAZADA' && <span className="text-rose-600">*</span>}
              </label>
              <textarea
                rows={3}
                value={dictamenModal.observaciones}
                onChange={(e) =>
                  setDictamenModal((prev) => ({ ...prev, observaciones: e.target.value }))
                }
                placeholder={
                  dictamenModal.accion === 'APROBADA'
                    ? 'Notas para el solicitante (opcional)...'
                    : 'Motivo del rechazo (ej: Espacio en mantenimiento o cruce institucional)...'
                }
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white text-slate-900 outline-none focus:ring-2 focus:ring-emerald-600"
              />
            </div>

            <div className="flex items-center justify-end space-x-2">
              <button
                type="button"
                onClick={() =>
                  setDictamenModal({
                    isOpen: false,
                    reservaId: 0,
                    accion: 'APROBADA',
                    observaciones: '',
                  })
                }
                className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={() => {
                  if (
                    dictamenModal.accion === 'RECHAZADA' &&
                    dictamenModal.observaciones.trim().length < 5
                  ) {
                    toast.error('La justificación de rechazo debe tener al menos 5 caracteres.');
                    return;
                  }
                  dictamenMutation.mutate({
                    id: dictamenModal.reservaId,
                    estado: dictamenModal.accion,
                    observaciones: dictamenModal.observaciones.trim() || undefined,
                  });
                }}
                disabled={dictamenMutation.isPending}
                className={`px-4 py-2 text-xs font-bold text-white rounded-xl shadow-xs ${
                  dictamenModal.accion === 'APROBADA'
                    ? 'bg-emerald-700 hover:bg-emerald-800'
                    : 'bg-rose-600 hover:bg-rose-700'
                }`}
              >
                {dictamenMutation.isPending ? 'Procesando...' : `Confirmar ${dictamenModal.accion}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
