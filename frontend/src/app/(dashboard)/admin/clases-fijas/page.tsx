// frontend/src/app/(dashboard)/admin/clases-fijas/page.tsx
'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  BookOpen,
  ArrowLeft,
  Plus,
  Trash2,
  Clock,
  Building2,
  CalendarDays,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  usePeriodosAcademicos,
  useClasesFijas,
  useCrearClaseFija,
  useEliminarClaseFija,
} from '../../../../hooks/use-infraestructura';
import { useEspacios } from '../../../../hooks/use-espacios';
import { Dialog } from '../../../../components/ui/dialog';

export default function AdminClasesFijasPage() {
  const { data: periodos = [] } = usePeriodosAcademicos();
  const { data: espaciosData } = useEspacios({ limit: 100 });
  const espacios = espaciosData?.data || [];

  const periodoActivo = periodos.find((p: any) => p.estado === 'ACTIVO');

  const [selectedPeriodoId, setSelectedPeriodoId] = useState<number | null>(null);
  const [selectedEspacioId, setSelectedEspacioId] = useState<number | null>(null);

  const currentPeriodoId = selectedPeriodoId || (periodoActivo ? periodoActivo.id : periodos[0]?.id);
  const currentEspacioId = selectedEspacioId || (espacios.length > 0 ? espacios[0].id : null);

  const { data: clasesFijas = [], isLoading } = useClasesFijas(
    currentEspacioId || 0,
    currentPeriodoId || undefined,
    !!currentEspacioId,
  );

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [nuevaClase, setNuevaClase] = useState({
    diaSemana: 1,
    horaInicio: '08:00',
    horaFin: '10:00',
    asignatura: '',
    docente: '',
    grupo: '',
  });

  const crearMutation = useCrearClaseFija();
  const eliminarMutation = useEliminarClaseFija(currentEspacioId || 0);

  const diasSemana = [
    { id: 1, nombre: 'Lunes' },
    { id: 2, nombre: 'Martes' },
    { id: 3, nombre: 'Miércoles' },
    { id: 4, nombre: 'Jueves' },
    { id: 5, nombre: 'Viernes' },
    { id: 6, nombre: 'Sábado' },
    { id: 7, nombre: 'Domingo' },
  ];

  const handleCrear = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentEspacioId || !currentPeriodoId) {
      toast.error('Selecciona un espacio físico y un periodo académico.');
      return;
    }
    if (!nuevaClase.asignatura || !nuevaClase.docente) {
      toast.error('Completa los campos obligatorios de asignatura y docente.');
      return;
    }

    const [hIni, mIni] = nuevaClase.horaInicio.split(':').map(Number);
    const [hFin, mFin] = nuevaClase.horaFin.split(':').map(Number);
    if (hFin * 60 + mFin <= hIni * 60 + mIni) {
      toast.error('La hora de fin debe ser posterior a la hora de inicio.');
      return;
    }

    crearMutation.mutate(
      {
        espacioId: currentEspacioId,
        periodoId: currentPeriodoId,
        diaSemana: nuevaClase.diaSemana,
        horaInicio: nuevaClase.horaInicio,
        horaFin: nuevaClase.horaFin,
        asignatura: nuevaClase.asignatura.trim(),
        docente: nuevaClase.docente.trim(),
        grupo: nuevaClase.grupo.trim() || undefined,
      },
      {
        onSuccess: () => {
          toast.success('Clase fija registrada exitosamente.');
          setIsModalOpen(false);
          setNuevaClase({
            diaSemana: 1,
            horaInicio: '08:00',
            horaFin: '10:00',
            asignatura: '',
            docente: '',
            grupo: '',
          });
        },
        onError: (err: any) => {
          toast.error(err.message || 'Conflicto o error al registrar la clase fija.');
        },
      },
    );
  };

  const handleEliminar = (id: number, asignatura: string) => {
    if (confirm(`¿Eliminar la clase fija "${asignatura}" de este espacio?`)) {
      eliminarMutation.mutate(id, {
        onSuccess: () => {
          toast.success('Clase fija eliminada.');
        },
        onError: (err: any) => {
          toast.error(err.message || 'Error al eliminar la clase fija.');
        },
      });
    }
  };

  const selectedEspacioObj = espacios.find((e: any) => e.id === currentEspacioId);

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
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
            Horarios Semestrales de Clases Fijas
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Asignaciones semanales recurrentes por aula para protección del calendario académico.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          disabled={!currentEspacioId || !currentPeriodoId}
          className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 shadow-xs transition-colors shrink-0 disabled:opacity-50"
        >
          <Plus className="h-4 w-4" />
          <span>Asignar Clase Fija</span>
        </button>
      </div>

      {/* Filtros: Periodo y Espacio */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div className="space-y-1">
          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600">
            Periodo Académico
          </label>
          <select
            value={currentPeriodoId || ''}
            onChange={(e) => setSelectedPeriodoId(parseInt(e.target.value, 10))}
            className="w-full text-xs font-semibold px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-800 shadow-2xs outline-none focus:ring-2 focus:ring-emerald-600"
          >
            {periodos.map((p: any) => (
              <option key={p.id} value={p.id}>
                Periodo {p.codigo} {p.estado === 'ACTIVO' ? '— (Activo / Vigente)' : `(${p.estado})`}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600">
            Espacio Físico
          </label>
          <select
            value={currentEspacioId || ''}
            onChange={(e) => setSelectedEspacioId(parseInt(e.target.value, 10))}
            className="w-full text-xs font-semibold px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-800 shadow-2xs outline-none focus:ring-2 focus:ring-emerald-600"
          >
            {espacios.map((esp: any) => (
              <option key={esp.id} value={esp.id}>
                {esp.identificador} — {esp.tipo} (Bloque {esp.bloque?.codigo})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Horario Semanal de Clases */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-slate-800">
          Programación para {selectedEspacioObj?.identificador || 'Espacio'} ({clasesFijas.length} clases asignadas)
        </h3>

        {isLoading ? (
          <div className="py-20 text-center text-slate-400 text-xs flex flex-col items-center justify-center bg-white rounded-2xl border border-slate-200">
            <Loader2 className="h-8 w-8 animate-spin text-emerald-700 mb-2" />
            Consultando clases fijas del espacio...
          </div>
        ) : clasesFijas.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 shadow-xs p-8">
            <BookOpen className="h-10 w-10 text-slate-300 mx-auto mb-2" />
            <h4 className="text-sm font-bold text-slate-800">Sin carga fija registrada</h4>
            <p className="text-xs text-slate-500 mt-1">
              Este espacio está libre de clases recurrentes para el periodo seleccionado.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {clasesFijas.map((clase: any) => (
              <div
                key={clase.id}
                className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between space-y-3"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-100 text-rose-800 uppercase">
                      {diasSemana.find((d) => d.id === clase.diaSemana)?.nombre || `Día ${clase.diaSemana}`}
                    </span>
                    <span className="font-mono text-xs font-bold text-slate-700">
                      {clase.horaInicio} - {clase.horaFin}
                    </span>
                  </div>

                  <h4 className="text-sm font-bold text-slate-900 leading-snug">
                    {clase.asignatura}
                  </h4>

                  <p className="text-xs text-slate-600">
                    Docente: <strong>{clase.docente}</strong>
                  </p>

                  {clase.grupo && (
                    <span className="inline-block font-mono text-[10px] px-2 py-0.5 bg-slate-100 rounded text-slate-700">
                      Grupo: {clase.grupo}
                    </span>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-end">
                  <button
                    type="button"
                    onClick={() => handleEliminar(clase.id, clase.asignatura)}
                    disabled={eliminarMutation.isPending}
                    className="inline-flex items-center space-x-1 text-xs font-semibold text-rose-600 hover:text-rose-800 transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>Eliminar</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal: Asignar Clase Fija */}
      <Dialog
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Asignar Clase Semanal Recurrente"
        description={`Espacio: ${selectedEspacioObj?.identificador || ''}`}
      >
        <form onSubmit={handleCrear} className="space-y-4">
          <div className="space-y-1">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
              Día de la Semana <span className="text-rose-500">*</span>
            </label>
            <select
              value={nuevaClase.diaSemana}
              onChange={(e) =>
                setNuevaClase({ ...nuevaClase, diaSemana: parseInt(e.target.value, 10) })
              }
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 text-slate-900 outline-none focus:ring-2 focus:ring-emerald-600"
            >
              {diasSemana.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.nombre}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                Hora Inicio (HH:mm) <span className="text-rose-500">*</span>
              </label>
              <input
                type="time"
                step="300"
                required
                value={nuevaClase.horaInicio}
                onChange={(e) => setNuevaClase({ ...nuevaClase, horaInicio: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 text-slate-900 outline-none focus:ring-2 focus:ring-emerald-600"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                Hora Fin (HH:mm) <span className="text-rose-500">*</span>
              </label>
              <input
                type="time"
                step="300"
                required
                value={nuevaClase.horaFin}
                onChange={(e) => setNuevaClase({ ...nuevaClase, horaFin: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 text-slate-900 outline-none focus:ring-2 focus:ring-emerald-600"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
              Nombre de la Asignatura <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="Ej: Cálculo Diferencial"
              value={nuevaClase.asignatura}
              onChange={(e) => setNuevaClase({ ...nuevaClase, asignatura: e.target.value })}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 text-slate-900 outline-none focus:ring-2 focus:ring-emerald-600"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
              Docente Titular <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="Ej: Ing. Carlos Pérez"
              value={nuevaClase.docente}
              onChange={(e) => setNuevaClase({ ...nuevaClase, docente: e.target.value })}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 text-slate-900 outline-none focus:ring-2 focus:ring-emerald-600"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
              Grupo (Opcional)
            </label>
            <input
              type="text"
              placeholder="Ej: 01, G-201"
              value={nuevaClase.grupo}
              onChange={(e) => setNuevaClase({ ...nuevaClase, grupo: e.target.value })}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 text-slate-900 outline-none focus:ring-2 focus:ring-emerald-600"
            />
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
              {crearMutation.isPending ? 'Guardando...' : 'Asignar Clase'}
            </button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
