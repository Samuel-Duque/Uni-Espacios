'use client';

import React from 'react';
import {
  FileText,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Calendar,
  User,
  ShieldCheck,
  ShieldAlert,
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface DetalleItem {
  id: number;
  itemInventarioId: number;
  estadoItem: 'PRESENTE_OPTIMO' | 'PRESENTE_DANADO' | 'FALTANTE';
  cantidadEncontrada: number;
  observacionNovedad?: string | null;
  itemInventario?: {
    codigo: string;
    nombre: string;
    categoria: string;
    cantidad: number;
  };
}

export interface VerificacionInventarioResponse {
  id: number;
  reservaId: number;
  tipo: 'CHECK_IN' | 'CHECK_OUT';
  estadoGeneral: 'CONFORME' | 'NO_CONFORME' | 'CON_NOVEDADES';
  fechaHora: string;
  observaciones?: string | null;
  verificador?: {
    id: number;
    nombreCompleto: string;
    email: string;
  };
  detalles: DetalleItem[];
}

interface ActaVerificacionViewProps {
  verificaciones: VerificacionInventarioResponse[];
}

export function ActaVerificacionView({ verificaciones }: ActaVerificacionViewProps) {
  if (!verificaciones || verificaciones.length === 0) {
    return (
      <div className="text-center py-6 text-xs text-slate-500 bg-slate-50 rounded-xl border border-slate-200">
        No se han emitido actas de verificación para esta reserva todavía.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {verificaciones.map((acta) => {
        const isConforme = acta.estadoGeneral === 'CONFORME';
        const isCheckIn = acta.tipo === 'CHECK_IN';

        return (
          <div
            key={acta.id}
            className={`bg-white rounded-2xl border overflow-hidden shadow-xs ${
              isConforme ? 'border-emerald-200' : 'border-amber-300'
            }`}
          >
            {/* Cabecera del Acta */}
            <div
              className={`px-5 py-3.5 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${
                isConforme
                  ? 'bg-emerald-50/70 border-emerald-100 text-emerald-950'
                  : 'bg-amber-50/80 border-amber-200 text-amber-950'
              }`}
            >
              <div className="flex items-center space-x-2.5">
                <FileText className={`h-5 w-5 ${isConforme ? 'text-emerald-700' : 'text-amber-700'}`} />
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-extrabold text-sm uppercase tracking-wide">
                      {isCheckIn ? 'Acta Digital de Check-In' : 'Acta Digital de Check-Out'}
                    </span>
                    <span className="text-[11px] font-mono font-semibold px-2 py-0.2 rounded-full bg-white/80 border text-slate-700">
                      Acta #{acta.id}
                    </span>
                  </div>
                  <div className="flex items-center space-x-3 text-[11px] text-slate-600 mt-0.5">
                    <span className="flex items-center space-x-1">
                      <Calendar className="h-3.5 w-3.5" />
                      <span>
                        {format(new Date(acta.fechaHora), "d 'de' MMMM, yyyy - HH:mm", {
                          locale: es,
                        })}
                      </span>
                    </span>
                    {acta.verificador && (
                      <span className="flex items-center space-x-1">
                        <User className="h-3.5 w-3.5" />
                        <span>Verificado por: {acta.verificador.nombreCompleto}</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Dictamen Badge */}
              <div className="flex items-center">
                <span
                  className={`inline-flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-bold ${
                    isConforme
                      ? 'bg-emerald-600 text-white'
                      : 'bg-amber-600 text-white'
                  }`}
                >
                  {isConforme ? (
                    <>
                      <ShieldCheck className="h-3.5 w-3.5" />
                      <span>CONFORME</span>
                    </>
                  ) : (
                    <>
                      <ShieldAlert className="h-3.5 w-3.5" />
                      <span>CON NOVEDADES</span>
                    </>
                  )}
                </span>
              </div>
            </div>

            {/* Observaciones generales si existen */}
            {acta.observaciones && (
              <div className="px-5 py-3 bg-slate-50/70 border-b border-slate-100 text-xs text-slate-700">
                <span className="font-semibold text-slate-900">Observaciones Generales:</span>{' '}
                <span className="italic">{acta.observaciones}</span>
              </div>
            )}

            {/* Tabla de Implementos Inspeccionados */}
            <div className="p-4 overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="pb-2">Implemento</th>
                    <th className="pb-2">Código / Placa</th>
                    <th className="pb-2 text-center">Cantidad</th>
                    <th className="pb-2">Estado Inspeccionado</th>
                    <th className="pb-2">Detalle de Novedad</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {acta.detalles.map((det) => {
                    const isOptimal = det.estadoItem === 'PRESENTE_OPTIMO';
                    const isDamaged = det.estadoItem === 'PRESENTE_DANADO';

                    return (
                      <tr key={det.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-2.5 font-semibold text-slate-900">
                          {det.itemInventario?.nombre || `Ítem #${det.itemInventarioId}`}
                        </td>
                        <td className="py-2.5 font-mono text-slate-600">
                          {det.itemInventario?.codigo || 'N/A'}
                        </td>
                        <td className="py-2.5 text-center font-bold text-slate-800">
                          {det.cantidadEncontrada}
                        </td>
                        <td className="py-2.5">
                          <span
                            className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                              isOptimal
                                ? 'bg-emerald-100 text-emerald-800'
                                : isDamaged
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {isOptimal ? (
                              <>
                                <CheckCircle2 className="h-3 w-3" />
                                <span>Óptimo</span>
                              </>
                            ) : isDamaged ? (
                              <>
                                <AlertTriangle className="h-3 w-3" />
                                <span>Dañado</span>
                              </>
                            ) : (
                              <>
                                <XCircle className="h-3 w-3" />
                                <span>Faltante</span>
                              </>
                            )}
                          </span>
                        </td>
                        <td className="py-2.5 text-slate-600">
                          {det.observacionNovedad ? (
                            <span className="text-amber-900 font-medium bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                              {det.observacionNovedad}
                            </span>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}
    </div>
  );
}
