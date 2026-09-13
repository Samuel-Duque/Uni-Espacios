// frontend/src/app/(dashboard)/admin/sedes/page.tsx
'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Building2,
  MapPin,
  ArrowLeft,
  Plus,
  Layers,
  Loader2,
  CheckCircle2,
} from 'lucide-react';
import { toast } from 'sonner';
import { useSedes, useBloques, useCrearSede, useCrearBloque } from '../../../../hooks/use-infraestructura';
import { Dialog } from '../../../../components/ui/dialog';

export default function AdminSedesPage() {
  const { data: sedes = [], isLoading: isLoadingSedes } = useSedes();
  const [selectedSedeId, setSelectedSedeId] = useState<number | null>(null);

  // Set default selected sede once loaded
  const currentSedeId = selectedSedeId || (sedes.length > 0 ? sedes[0].id : null);

  const { data: bloques = [], isLoading: isLoadingBloques } = useBloques(
    currentSedeId || undefined,
  );

  // Modales
  const [isSedeModalOpen, setIsSedeModalOpen] = useState(false);
  const [isBloqueModalOpen, setIsBloqueModalOpen] = useState(false);

  // Form states
  const [nuevaSede, setNuevaSede] = useState({ nombre: '', ciudad: '', direccion: '' });
  const [nuevoBloque, setNuevoBloque] = useState({ codigo: '', descripcion: '' });

  const crearSedeMutation = useCrearSede();
  const crearBloqueMutation = useCrearBloque();

  const handleCrearSede = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevaSede.nombre || !nuevaSede.ciudad || !nuevaSede.direccion) {
      toast.error('Completa todos los campos de la sede.');
      return;
    }
    crearSedeMutation.mutate(nuevaSede, {
      onSuccess: () => {
        toast.success('Sede creada exitosamente.');
        setIsSedeModalOpen(false);
        setNuevaSede({ nombre: '', ciudad: '', direccion: '' });
      },
      onError: (err: any) => {
        toast.error(err.message || 'Error al crear la sede.');
      },
    });
  };

  const handleCrearBloque = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentSedeId) {
      toast.error('Selecciona una sede para asociar el bloque.');
      return;
    }
    if (!nuevoBloque.codigo) {
      toast.error('El código del bloque es obligatorio.');
      return;
    }
    crearBloqueMutation.mutate(
      {
        sedeId: currentSedeId,
        codigo: nuevoBloque.codigo.toUpperCase().trim(),
        descripcion: nuevoBloque.descripcion.trim() || undefined,
      },
      {
        onSuccess: () => {
          toast.success('Bloque físico creado exitosamente.');
          setIsBloqueModalOpen(false);
          setNuevoBloque({ codigo: '', descripcion: '' });
        },
        onError: (err: any) => {
          toast.error(err.message || 'Error al crear el bloque.');
        },
      },
    );
  };

  const selectedSedeObj = sedes.find((s: any) => s.id === currentSedeId);

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
            Sedes y Bloques Físicos
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Configuración territorial de campus universitarios e infraestructura edilicia.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={() => setIsSedeModalOpen(true)}
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 shadow-2xs transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>Nueva Sede</span>
          </button>

          <button
            type="button"
            onClick={() => setIsBloqueModalOpen(true)}
            disabled={!currentSedeId}
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 shadow-xs transition-colors disabled:opacity-50"
          >
            <Plus className="h-4 w-4" />
            <span>Nuevo Bloque</span>
          </button>
        </div>
      </div>

      {/* Selector de Sede */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Columna Lateral: Listado de Sedes */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Sedes Institucionales ({sedes.length})
          </h3>

          {isLoadingSedes ? (
            <div className="py-8 text-center text-slate-400 text-xs flex items-center justify-center">
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Cargando sedes...
            </div>
          ) : (
            <div className="space-y-2">
              {sedes.map((sede: any) => {
                const isSelected = sede.id === currentSedeId;
                return (
                  <button
                    key={sede.id}
                    type="button"
                    onClick={() => setSelectedSedeId(sede.id)}
                    className={`w-full text-left p-3.5 rounded-xl border transition-all ${
                      isSelected
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-950 shadow-xs'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div className="font-bold text-sm">{sede.nombre}</div>
                    <div className="flex items-center space-x-1 text-xs text-slate-500 mt-1">
                      <MapPin className="h-3 w-3 text-slate-400" />
                      <span>{sede.ciudad} — {sede.direccion}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Columna Principal: Bloques de la Sede Seleccionada */}
        <div className="lg:col-span-3 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">
              Bloques Físicos en {selectedSedeObj?.nombre || 'la Sede Seleccionada'} ({bloques.length})
            </h3>
          </div>

          {isLoadingBloques ? (
            <div className="py-16 text-center text-slate-400 text-xs flex flex-col items-center justify-center bg-white rounded-2xl border border-slate-200">
              <Loader2 className="h-6 w-6 animate-spin text-emerald-700 mb-2" />
              Cargando bloques físicos...
            </div>
          ) : bloques.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 p-8 shadow-xs">
              <Layers className="h-10 w-10 text-slate-300 mx-auto mb-2" />
              <h4 className="text-sm font-bold text-slate-800">No hay bloques registrados</h4>
              <p className="text-xs text-slate-500 mt-1">
                Utiliza el botón &quot;Nuevo Bloque&quot; para registrar edificios en esta sede.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {bloques.map((b: any) => (
                <div
                  key={b.id}
                  className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-emerald-300 transition-all flex flex-col justify-between"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-base text-slate-900">
                        Bloque {b.codigo}
                      </span>
                      <span className="font-mono text-[10px] text-slate-400">ID #{b.id}</span>
                    </div>
                    {b.descripcion ? (
                      <p className="text-xs text-slate-600">{b.descripcion}</p>
                    ) : (
                      <p className="text-xs text-slate-400 italic">Sin descripción registrada</p>
                    )}
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-500">
                    Sede: <strong>{selectedSedeObj?.nombre}</strong>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal: Crear Sede */}
      <Dialog
        isOpen={isSedeModalOpen}
        onClose={() => setIsSedeModalOpen(false)}
        title="Registrar Nueva Sede Institucional"
        description="Agrega un campus o sede territorial del Politécnico Jaime Isaza Cadavid."
      >
        <form onSubmit={handleCrearSede} className="space-y-4">
          <div className="space-y-1">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
              Nombre de la Sede <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="Ej: Sede Poblado (Medellín)"
              value={nuevaSede.nombre}
              onChange={(e) => setNuevaSede({ ...nuevaSede, nombre: e.target.value })}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 text-slate-900 outline-none focus:ring-2 focus:ring-emerald-600"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
              Ciudad <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="Ej: Medellín"
              value={nuevaSede.ciudad}
              onChange={(e) => setNuevaSede({ ...nuevaSede, ciudad: e.target.value })}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 text-slate-900 outline-none focus:ring-2 focus:ring-emerald-600"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
              Dirección <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="Ej: Cra 48 # 7 - 151"
              value={nuevaSede.direccion}
              onChange={(e) => setNuevaSede({ ...nuevaSede, direccion: e.target.value })}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 text-slate-900 outline-none focus:ring-2 focus:ring-emerald-600"
            />
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-2">
            <button
              type="button"
              onClick={() => setIsSedeModalOpen(false)}
              className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={crearSedeMutation.isPending}
              className="px-4 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl shadow-xs disabled:opacity-50"
            >
              {crearSedeMutation.isPending ? 'Guardando...' : 'Crear Sede'}
            </button>
          </div>
        </form>
      </Dialog>

      {/* Modal: Crear Bloque */}
      <Dialog
        isOpen={isBloqueModalOpen}
        onClose={() => setIsBloqueModalOpen(false)}
        title={`Registrar Bloque en ${selectedSedeObj?.nombre || ''}`}
        description="Agrega un bloque o edificio físico al inventario de infraestructura."
      >
        <form onSubmit={handleCrearBloque} className="space-y-4">
          <div className="space-y-1">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
              Código del Bloque <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="Ej: P40, P19, P31"
              value={nuevoBloque.codigo}
              onChange={(e) => setNuevoBloque({ ...nuevoBloque, codigo: e.target.value })}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 text-slate-900 outline-none focus:ring-2 focus:ring-emerald-600 uppercase"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
              Descripción del Edificio / Bloque
            </label>
            <input
              type="text"
              placeholder="Ej: Aulas Generales y Laboratorios de Electrónica"
              value={nuevoBloque.descripcion}
              onChange={(e) => setNuevoBloque({ ...nuevoBloque, descripcion: e.target.value })}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 text-slate-900 outline-none focus:ring-2 focus:ring-emerald-600"
            />
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-2">
            <button
              type="button"
              onClick={() => setIsBloqueModalOpen(false)}
              className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={crearBloqueMutation.isPending}
              className="px-4 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl shadow-xs disabled:opacity-50"
            >
              {crearBloqueMutation.isPending ? 'Guardando...' : 'Crear Bloque'}
            </button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
