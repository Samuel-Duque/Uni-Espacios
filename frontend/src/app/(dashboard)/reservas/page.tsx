'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  CalendarDays,
  Clock,
  MapPin,
  FileCheck,
  FileText,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Loader2,
  ChevronRight,
  ShieldAlert,
  ArrowRight,
  Filter,
} from 'lucide-react';
import { format, differenceInMinutes, isBefore, isAfter } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';
import { reservasApi, verificacionesApi, ApiError } from '../../../lib/api';
import { useAuth } from '../../../lib/auth-context';
import { VerificacionModal } from '../../../components/inventario/verificacion-modal';
import { ActaVerificacionView } from '../../../components/inventario/acta-verificacion-view';

export default function ReservasPage() {
  const { user, inhabilitadoParaReservar } = useAuth();
  const queryClient = useQueryClient();

  const [estadoFilter, setEstadoFilter] = useState<string>('');
  const [activeModal, setActiveModal] = useState<{
    isOpen: boolean;
    tipo: 'CHECK_IN' | 'CHECK_OUT';
    reservaId: number;
    espacioId: number;
    espacioNombre: string;
  }>({
    isOpen: false,
    tipo: 'CHECK_IN',
    reservaId: 0,
    espacioId: 0,
    espacioNombre: '',
  });

  const [actasModal, setActasModal] = useState<{
    isOpen: boolean;
    reservaId: number;
    espacioNombre: string;
    verificaciones: any[];
  }>({
    isOpen: false,
    reservaId: 0,
    espacioNombre: '',
    verificaciones: [],
  });

  // 1. Cargar mis reservas
  const {
    data: reservasData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['mis-reservas', estadoFilter],
    queryFn: () => reservasApi.getMisReservas({ estado: estadoFilter || undefined }),
  });

  // 2. Mutación Cancelar Reserva
  const cancelMutation = useMutation({
    mutationFn: (id: number) => reservasApi.cancelar(id),
    onSuccess: () => {
      toast.success('Reserva cancelada exitosamente');
      queryClient.invalidateQueries({ queryKey: ['mis-reservas'] });
    },
    onError: (err: unknown) => {
      const msg =
        err instanceof ApiError ? err.message : 'Error al cancelar la reserva';
      toast.error(msg);
    },
  });

  // Helper para evaluar ventana de Check-In
  const getCheckInStatus = (fechaInicio: string, estado: string) => {
    if (estado !== 'APROBADA') return null;

    const ahora = new Date();
    const tIni = new Date(fechaInicio);
    const ventanaIni = new Date(tIni.getTime() - 15 * 60 * 1000);
    const ventanaFin = new Date(tIni.getTime() + 20 * 60 * 1000);

    if (isBefore(ahora, ventanaIni)) {
      const minutosFaltantes = differenceInMinutes(ventanaIni, ahora);
      return {
        habilitado: false,
        badgeText: `Check-In disponible en ${minutosFaltantes} min (${format(ventanaIni, 'HH:mm')})`,
        variant: 'upcoming',
      };
    } else if (isAfter(ahora, ventanaFin)) {
      return {
        habilitado: false,
        badgeText: 'Ventana de Check-In vencida (+20 min)',
        variant: 'expired',
      };
    } else {
      return {
        habilitado: true,
        badgeText: '🟢 Check-In Habilitado Ahora',
        variant: 'active',
      };
    }
  };

  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case 'APROBADA':
        return 'bg-sky-100 text-sky-800 border-sky-200';
      case 'EN_USO':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200 animate-pulse';
      case 'FINALIZADA':
        return 'bg-slate-100 text-slate-800 border-slate-200';
      case 'PENDIENTE':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'RECHAZADA':
        return 'bg-rose-100 text-rose-800 border-rose-200';
      case 'CANCELADA':
        return 'bg-zinc-100 text-zinc-600 border-zinc-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const handleOpenVerificaciones = (reserva: any) => {
    setActasModal({
      isOpen: true,
      reservaId: reserva.id,
      espacioNombre: reserva.espacio?.nombre || `Espacio #${reserva.espacioId}`,
      verificaciones: reserva.verificaciones || [],
    });
  };

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header Principal */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
            Mis Reservas y Custodia
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Historial de solicitudes, actas de Check-In, Check-Out e inspección de inventarios.
          </p>
        </div>

        {/* Filtro por Estado */}
        <div className="flex items-center space-x-2">
          <Filter className="h-4 w-4 text-slate-400" />
          <select
            value={estadoFilter}
            onChange={(e) => setEstadoFilter(e.target.value)}
            className="text-xs font-semibold px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 shadow-xs outline-none focus:ring-2 focus:ring-emerald-600"
          >
            <option value="">Todos los estados</option>
            <option value="APROBADA">Aprobadas</option>
            <option value="EN_USO">En Uso (Activas)</option>
            <option value="FINALIZADA">Finalizadas</option>
            <option value="PENDIENTE">Pendientes de Dictamen</option>
            <option value="RECHAZADA">Rechazadas</option>
            <option value="CANCELADA">Canceladas</option>
          </select>
        </div>
      </div>

      {/* Alerta si el usuario está inhabilitado */}
      {inhabilitadoParaReservar && (
        <div className="mt-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 flex items-start space-x-3 text-xs shadow-xs">
          <ShieldAlert className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <h4 className="font-bold">Inhabilitación Activa para Nuevas Reservas</h4>
            <p className="mt-0.5 text-rose-800">
              {user?.motivoInhabilitacion || 'Tienes un reporte pendiente de novedad en inventario. Por favor comunícate con la coordinación de espacios para solventarlo.'}
            </p>
          </div>
        </div>
      )}

      {/* Lista de Reservas */}
      <div className="mt-8">
        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center text-slate-500">
            <Loader2 className="h-8 w-8 animate-spin text-emerald-700 mb-3" />
            <span className="text-xs font-semibold">Cargando tus reservas...</span>
          </div>
        ) : error ? (
          <div className="p-6 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-center text-xs">
            Error al consultar tus reservas. Por favor recarga la página.
          </div>
        ) : reservasData?.data?.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 shadow-xs p-8">
            <CalendarDays className="h-10 w-10 text-slate-300 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-slate-800">No se encontraron reservas</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              No tienes reservas con el filtro seleccionado. Puedes explorar el catálogo de espacios para realizar una solicitud.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {reservasData?.data?.map((reserva: any) => {
              const checkInStatus = getCheckInStatus(reserva.fechaInicio, reserva.estado);
              const hasActas = reserva.verificaciones && reserva.verificaciones.length > 0;

              return (
                <div
                  key={reserva.id}
                  className="bg-white rounded-2xl border border-slate-200 shadow-xs hover:border-slate-300 transition-all p-5 sm:p-6"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    {/* Detalles de la Reserva */}
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2.5 flex-wrap gap-y-1">
                        <span className="text-xs font-mono font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                          Reserva #{reserva.id}
                        </span>
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${getEstadoBadge(
                            reserva.estado,
                          )}`}
                        >
                          {reserva.estado}
                        </span>
                        {checkInStatus && (
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                              checkInStatus.variant === 'active'
                                ? 'bg-emerald-600 text-white shadow-xs animate-bounce'
                                : checkInStatus.variant === 'upcoming'
                                  ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                  : 'bg-rose-100 text-rose-900'
                            }`}
                          >
                            {checkInStatus.badgeText}
                          </span>
                        )}
                      </div>

                      <h3 className="text-base sm:text-lg font-bold text-slate-900">
                        {reserva.espacio?.nombre}
                      </h3>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600">
                        <div className="flex items-center space-x-1">
                          <MapPin className="h-3.5 w-3.5 text-slate-400" />
                          <span>
                            Bloque {reserva.espacio?.bloque?.codigo || 'N/A'} — Sede{' '}
                            {reserva.espacio?.bloque?.sede?.nombre || 'Poblado'}
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

                      <p className="text-xs text-slate-500 italic mt-1">
                        <strong>Motivo:</strong> {reserva.motivo}
                      </p>
                    </div>

                    {/* Botones de Acción Contextuales */}
                    <div className="flex flex-wrap items-center gap-2 pt-2 lg:pt-0 shrink-0">
                      {/* Botón de Check-In */}
                      {reserva.estado === 'APROBADA' && (
                        <button
                          type="button"
                          onClick={() =>
                            setActiveModal({
                              isOpen: true,
                              tipo: 'CHECK_IN',
                              reservaId: reserva.id,
                              espacioId: reserva.espacioId,
                              espacioNombre: reserva.espacio?.nombre,
                            })
                          }
                          disabled={!checkInStatus?.habilitado && user?.rol === 'ESTUDIANTE'}
                          className={`flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-xs ${
                            checkInStatus?.habilitado || user?.rol !== 'ESTUDIANTE'
                              ? 'bg-emerald-700 hover:bg-emerald-800 text-white cursor-pointer'
                              : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                          }`}
                        >
                          <FileCheck className="h-4 w-4" />
                          <span>Realizar Check-In</span>
                        </button>
                      )}

                      {/* Botón de Check-Out */}
                      {reserva.estado === 'EN_USO' && (
                        <button
                          type="button"
                          onClick={() =>
                            setActiveModal({
                              isOpen: true,
                              tipo: 'CHECK_OUT',
                              reservaId: reserva.id,
                              espacioId: reserva.espacioId,
                              espacioNombre: reserva.espacio?.nombre,
                            })
                          }
                          className="flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-slate-900 hover:bg-black text-white transition-all shadow-xs"
                        >
                          <FileCheck className="h-4 w-4" />
                          <span>Realizar Check-Out</span>
                        </button>
                      )}

                      {/* Botón para ver actas digitales emitidas */}
                      {hasActas && (
                        <button
                          type="button"
                          onClick={() => handleOpenVerificaciones(reserva)}
                          className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
                        >
                          <FileText className="h-4 w-4 text-emerald-700" />
                          <span>Ver Actas ({reserva.verificaciones.length})</span>
                        </button>
                      )}

                      {/* Cancelar Reserva */}
                      {['PENDIENTE', 'APROBADA'].includes(reserva.estado) && (
                        <button
                          type="button"
                          onClick={() => {
                            if (confirm('¿Seguro que deseas cancelar esta solicitud de reserva?')) {
                              cancelMutation.mutate(reserva.id);
                            }
                          }}
                          disabled={cancelMutation.isPending}
                          className="px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                        >
                          Cancelar
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal de Check-In / Check-Out */}
      {activeModal.isOpen && (
        <VerificacionModal
          isOpen={activeModal.isOpen}
          onClose={() =>
            setActiveModal({
              isOpen: false,
              tipo: 'CHECK_IN',
              reservaId: 0,
              espacioId: 0,
              espacioNombre: '',
            })
          }
          tipo={activeModal.tipo}
          reservaId={activeModal.reservaId}
          espacioId={activeModal.espacioId}
          espacioNombre={activeModal.espacioNombre}
        />
      )}

      {/* Modal de Consulta de Actas Digitales */}
      {actasModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-6 shadow-2xl border border-slate-100 my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Actas Digitales de Verificación
                </h3>
                <p className="text-xs text-slate-500">
                  Reserva #{actasModal.reservaId} — {actasModal.espacioNombre}
                </p>
              </div>
              <button
                type="button"
                onClick={() =>
                  setActasModal({
                    isOpen: false,
                    reservaId: 0,
                    espacioNombre: '',
                    verificaciones: [],
                  })
                }
                className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Cerrar
              </button>
            </div>

            <div className="mt-5 max-h-[70vh] overflow-y-auto pr-1">
              <ActaVerificacionView verificaciones={actasModal.verificaciones} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
