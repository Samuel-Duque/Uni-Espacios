'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ClipboardCheck,
  AlertTriangle,
  UserCheck,
  UserX,
  FileText,
  Calendar,
  MapPin,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  ShieldAlert,
  ShieldCheck,
  Mail,
  Phone,
  MessageSquare,
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';
import {
  reservasApi,
  verificacionesApi,
  usuariosApi,
  ApiError,
} from '../../../lib/api';
import { useAuth } from '../../../lib/auth-context';
import { ActaVerificacionView } from '../../../components/inventario/acta-verificacion-view';

export default function GestionPage() {
  const { isGestor, isSuperAdmin } = useAuth();
  const queryClient = useQueryClient();

  const [currentTab, setCurrentTab] = useState<'NOVEDADES' | 'APROBACIONES'>('NOVEDADES');
  const [novedadesPage, setNovedadesPage] = useState(1);
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

  // Modal para ver actas de una reserva
  const [selectedVerificaciones, setSelectedVerificaciones] = useState<{
    isOpen: boolean;
    reservaId: number;
    actas: any[];
  }>({
    isOpen: false,
    reservaId: 0,
    actas: [],
  });

  // 1. Query: Reporte de Novedades de Inventario
  const {
    data: novedadesData,
    isLoading: isLoadingNovedades,
    error: novedadesError,
  } = useQuery({
    queryKey: ['verificaciones-novedades', novedadesPage],
    queryFn: () => verificacionesApi.getNovedades(novedadesPage, 10),
    enabled: isGestor || isSuperAdmin,
  });

  // 2. Query: Reservas de Gestión
  const {
    data: gestionData,
    isLoading: isLoadingGestion,
    error: gestionError,
  } = useQuery({
    queryKey: ['reservas-gestion', aprobacionesEstado],
    queryFn: () => reservasApi.getGestion({ estado: aprobacionesEstado || undefined }),
    enabled: isGestor || isSuperAdmin,
  });

  // 3. Mutación: Rehabilitar Usuario
  const rehabilitarMutation = useMutation({
    mutationFn: (usuarioId: number) => usuariosApi.rehabilitar(usuarioId),
    onSuccess: () => {
      toast.success('Usuario rehabilitado exitosamente. Ahora puede volver a solicitar reservas.');
      queryClient.invalidateQueries({ queryKey: ['verificaciones-novedades'] });
      queryClient.invalidateQueries({ queryKey: ['reservas-gestion'] });
    },
    onError: (err: unknown) => {
      const msg =
        err instanceof ApiError ? err.message : 'Error al rehabilitar el usuario';
      toast.error(msg);
    },
  });

  // 4. Mutación: Dictamen de Reserva (Aprobar / Rechazar)
  const dictamenMutation = useMutation({
    mutationFn: (payload: { id: number; estado: string; observaciones?: string }) =>
      reservasApi.cambiarEstado(payload.id, {
        estado: payload.estado,
        observaciones: payload.observaciones,
      }),
    onSuccess: (_, vars) => {
      toast.success(`Reserva #${vars.id} dictaminada como ${vars.estado}`);
      queryClient.invalidateQueries({ queryKey: ['reservas-gestion'] });
      setDictamenModal({ isOpen: false, reservaId: 0, accion: 'APROBADA', observaciones: '' });
    },
    onError: (err: unknown) => {
      const msg =
        err instanceof ApiError ? err.message : 'Error al dictaminar la reserva';
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
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Cabecera del Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
            Panel del Gestor de Espacios
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Gestión de novedades de inventario, custodia de implementos y aprobación de reservas.
          </p>
        </div>

        {/* Selector de Pestañas */}
        <div className="flex rounded-xl bg-slate-200/80 p-1 border border-slate-300/60 shrink-0">
          <button
            type="button"
            onClick={() => setCurrentTab('NOVEDADES')}
            className={`flex items-center space-x-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              currentTab === 'NOVEDADES'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <span>Novedades de Inventario</span>
            {novedadesData?.meta?.total ? (
              <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-rose-100 text-rose-800 font-extrabold">
                {novedadesData.meta.total}
              </span>
            ) : null}
          </button>

          <button
            type="button"
            onClick={() => setCurrentTab('APROBACIONES')}
            className={`flex items-center space-x-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              currentTab === 'APROBACIONES'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ClipboardCheck className="h-4 w-4 text-emerald-600" />
            <span>Bandeja de Aprobaciones</span>
          </button>
        </div>
      </div>

      {/* PESTAÑA 1: NOVEDADES DE INVENTARIO (TSK-705) */}
      {currentTab === 'NOVEDADES' && (
        <div className="mt-8 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
              <span>Reportes de Check-Out con Daños o Faltantes</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 font-semibold">
                {novedadesData?.meta?.total || 0} caso(s) registrado(s)
              </span>
            </h2>
          </div>

          {isLoadingNovedades ? (
            <div className="py-20 flex flex-col items-center justify-center text-slate-500">
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
                            Acta de Novedad #{reporte.id}
                          </span>
                          <span className="text-xs font-bold text-slate-800">
                            Reserva #{reporte.reservaId} — {reporte.reserva?.espacio?.nombre}
                          </span>
                          <span className="text-xs text-slate-500">
                            ({reporte.reserva?.espacio?.bloque?.codigo}, Sede{' '}
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
                                  <strong>Observación de daño:</strong>{' '}
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
      )}

      {/* PESTAÑA 2: BANDEJA DE APROBACIONES DE RESERVAS (EPIC-06) */}
      {currentTab === 'APROBACIONES' && (
        <div className="mt-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h2 className="text-lg font-bold text-slate-900">Solicitudes de Reserva</h2>

            <div className="flex items-center space-x-2">
              <select
                value={aprobacionesEstado}
                onChange={(e) => setAprobacionesEstado(e.target.value)}
                className="text-xs font-semibold px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 shadow-xs outline-none focus:ring-2 focus:ring-emerald-600"
              >
                <option value="PENDIENTE">Pendientes de Aprobación</option>
                <option value="APROBADA">Aprobadas</option>
                <option value="EN_USO">En Uso Activo</option>
                <option value="FINALIZADA">Finalizadas</option>
                <option value="RECHAZADA">Rechazadas</option>
                <option value="">Todas</option>
              </select>
            </div>
          </div>

          {isLoadingGestion ? (
            <div className="py-20 flex flex-col items-center justify-center text-slate-500">
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
                No hay reservas para dictaminar en el estado seleccionado.
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
                        Solicitado por: <strong>{reserva.usuario?.nombreCompleto}</strong> ({reserva.usuario?.rol})
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-slate-900">
                      {reserva.espacio?.nombre}
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
      )}

      {/* Modal de Dictamen (Aprobar / Rechazar) */}
      {dictamenModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
            <h3 className="text-base font-bold text-slate-900 mb-2">
              {dictamenModal.accion === 'APROBADA'
                ? 'Aprobar Solicitud de Reserva'
                : 'Rechazar Solicitud de Reserva'}
            </h3>

            <p className="text-xs text-slate-600 mb-4">
              {dictamenModal.accion === 'APROBADA'
                ? 'El sistema validará de forma atómica la disponibilidad horaria antes de confirmar.'
                : 'Debes proporcionar una justificación obligatoria (mínimo 5 caracteres) para el rechazo.'}
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
                    : 'Motivo del rechazo (ej: Espacio en mantenimiento preventivo)...'
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
