// frontend/src/app/(dashboard)/admin/periodos/page.tsx
'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  CalendarDays,
  ArrowLeft,
  Plus,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Play,
  Clock,
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';
import { usePeriodosAcademicos, useCrearPeriodo, useActivarPeriodo } from '../../../../hooks/use-infraestructura';
import { Dialog } from '../../../../components/ui/dialog';

export default function AdminPeriodosPage() {
  const { data: periodos = [], isLoading } = usePeriodosAcademicos();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [nuevoPeriodo, setNuevoPeriodo] = useState({
    codigo: '',
    fechaInicio: '',
    fechaFin: '',
    estado: 'PLANIFICACION',
  });

  const crearMutation = useCrearPeriodo();
  const activarMutation = useActivarPeriodo();

  const handleCrear = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevoPeriodo.codigo || !nuevoPeriodo.fechaInicio || !nuevoPeriodo.fechaFin) {
      toast.error('Completa todos los campos obligatorios.');
      return;
    }

    if (new Date(nuevoPeriodo.fechaFin) <= new Date(nuevoPeriodo.fechaInicio)) {
      toast.error('La fecha de fin debe ser posterior a la fecha de inicio.');
      return;
    }

    // Convert to ISO 8601 strings
    const fechaInicioIso = new Date(`${nuevoPeriodo.fechaInicio}T00:00:00.000Z`).toISOString();
    const fechaFinIso = new Date(`${nuevoPeriodo.fechaFin}T23:59:59.000Z`).toISOString();

    crearMutation.mutate(
      {
        codigo: nuevoPeriodo.codigo.trim(),
        fechaInicio: fechaInicioIso,
        fechaFin: fechaFinIso,
        estado: nuevoPeriodo.estado,
      },
      {
        onSuccess: () => {
          toast.success('Periodo académico registrado exitosamente.');
          setIsModalOpen(false);
          setNuevoPeriodo({ codigo: '', fechaInicio: '', fechaFin: '', estado: 'PLANIFICACION' });
        },
        onError: (err: any) => {
          toast.error(err.message || 'Error al registrar el periodo académico.');
        },
      },
    );
  };

  const handleActivar = (id: number, codigo: string) => {
    if (
      confirm(
        `¿Estás seguro de marcar como ACTIVO el periodo ${codigo}? Esta acción finalizará de forma atómica los periodos actualmente vigentes.`,
      )
    ) {
      activarMutation.mutate(id, {
        onSuccess: () => {
          toast.success(`Periodo ${codigo} activado exitosamente.`);
        },
        onError: (err: any) => {
          toast.error(err.message || 'Error al activar el periodo.');
        },
      });
    }
  };

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 max-w-4xl">
      {/* Botón Volver */}
      <div>
        <Link
          href="/admin"
          className="inline-flex items-center space-x-1.5 text-xs font-semibold text-slate-500 hover:text-emerald-700 transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Volver al Panel de Administración</span>
        </Link>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
            Periodos Académicos Semestrales
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Gestión de semestres (2026-1, 2026-2) para control de disponibilidad y clases fijas.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 shadow-xs transition-colors shrink-0"
        >
          <Plus className="h-4 w-4" />
          <span>Nuevo Periodo</span>
        </button>
      </div>

      {/* Lista de Periodos */}
      {isLoading ? (
        <div className="py-20 text-center text-slate-400 text-xs flex flex-col items-center justify-center bg-white rounded-2xl border border-slate-200">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-700 mb-2" />
          Cargando periodos académicos...
        </div>
      ) : periodos.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 shadow-xs p-8">
          <CalendarDays className="h-10 w-10 text-slate-300 mx-auto mb-2" />
          <h3 className="text-sm font-bold text-slate-800">No hay periodos registrados</h3>
          <p className="text-xs text-slate-500 mt-1">
            Registra tu primer periodo académico para iniciar la programación semestral.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {periodos.map((periodo: any) => {
            const isActivo = periodo.estado === 'ACTIVO';
            return (
              <div
                key={periodo.id}
                className={`p-5 rounded-2xl border transition-all bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                  isActivo
                    ? 'border-emerald-500/60 shadow-md ring-1 ring-emerald-500/20'
                    : 'border-slate-200 shadow-xs'
                }`}
              >
                <div className="space-y-1.5">
                  <div className="flex items-center space-x-2">
                    <span className="font-extrabold text-lg text-slate-900">
                      Periodo {periodo.codigo}
                    </span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                        isActivo
                          ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                          : periodo.estado === 'PLANIFICACION'
                            ? 'bg-blue-100 text-blue-900 border border-blue-300'
                            : 'bg-slate-100 text-slate-600 border border-slate-200'
                      }`}
                    >
                      {periodo.estado}
                    </span>
                  </div>

                  <div className="flex items-center space-x-2 text-xs text-slate-600">
                    <Clock className="h-3.5 w-3.5 text-slate-400" />
                    <span>
                      Vigencia:{' '}
                      <strong>
                        {format(new Date(periodo.fechaInicio), 'dd/MM/yyyy')}
                      </strong>{' '}
                      al{' '}
                      <strong>
                        {format(new Date(periodo.fechaFin), 'dd/MM/yyyy')}
                      </strong>
                    </span>
                  </div>
                </div>

                {/* Acciones */}
                <div>
                  {!isActivo && periodo.estado !== 'FINALIZADO' && (
                    <button
                      type="button"
                      onClick={() => handleActivar(periodo.id, periodo.codigo)}
                      disabled={activarMutation.isPending}
                      className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 shadow-xs transition-colors"
                    >
                      <Play className="h-3.5 w-3.5 fill-current" />
                      <span>Activar Periodo</span>
                    </button>
                  )}
                  {isActivo && (
                    <span className="inline-flex items-center space-x-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
                      <CheckCircle2 className="h-4 w-4" />
                      <span>Periodo Vigente</span>
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Crear Periodo */}
      <Dialog
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Registrar Periodo Académico"
        description="Define el código del semestre y las fechas límites de operación."
      >
        <form onSubmit={handleCrear} className="space-y-4">
          <div className="space-y-1">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
              Código del Periodo (YYYY-1 o YYYY-2) <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="Ej: 2026-2"
              value={nuevoPeriodo.codigo}
              onChange={(e) => setNuevoPeriodo({ ...nuevoPeriodo, codigo: e.target.value })}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 text-slate-900 outline-none focus:ring-2 focus:ring-emerald-600 font-mono"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                Fecha de Inicio <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                required
                value={nuevoPeriodo.fechaInicio}
                onChange={(e) =>
                  setNuevoPeriodo({ ...nuevoPeriodo, fechaInicio: e.target.value })
                }
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 text-slate-900 outline-none focus:ring-2 focus:ring-emerald-600"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                Fecha de Fin <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                required
                value={nuevoPeriodo.fechaFin}
                onChange={(e) =>
                  setNuevoPeriodo({ ...nuevoPeriodo, fechaFin: e.target.value })
                }
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 text-slate-900 outline-none focus:ring-2 focus:ring-emerald-600"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
              Estado Inicial
            </label>
            <select
              value={nuevoPeriodo.estado}
              onChange={(e) => setNuevoPeriodo({ ...nuevoPeriodo, estado: e.target.value })}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 text-slate-900 outline-none focus:ring-2 focus:ring-emerald-600"
            >
              <option value="PLANIFICACION">Planificación</option>
              <option value="ACTIVO">Activo</option>
            </select>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-2">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={crearMutation.isPending}
              className="px-4 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl shadow-xs disabled:opacity-50"
            >
              {crearMutation.isPending ? 'Guardando...' : 'Crear Periodo'}
            </button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
