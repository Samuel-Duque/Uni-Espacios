'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Laptop,
  Trophy,
  Armchair,
  BookOpen,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Info,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import { inventarioApi, ApiError } from '../../lib/api';
import { useAuth } from '../../lib/auth-context';
import {
  CreateItemInventarioSchema,
  CreateItemInventarioInput,
  CategoriaItem,
  EstadoItem,
} from '../../schemas/inventario.schema';

interface EspacioInventarioTabProps {
  espacioId: number;
  espacioNombre: string;
}

export function EspacioInventarioTab({ espacioId, espacioNombre }: EspacioInventarioTabProps) {
  const { isGestor, isSuperAdmin } = useAuth();
  const canManage = isGestor || isSuperAdmin;
  const queryClient = useQueryClient();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any | null>(null);

  // 1. Cargar inventario del espacio
  const {
    data: items,
    isLoading,
    error,
  } = useQuery<any[]>({
    queryKey: ['inventario-espacio', espacioId],
    queryFn: () => inventarioApi.getByEspacio(espacioId),
  });

  // 2. Formulario con React Hook Form + Zod
  const {
    register,
    handleSubmit,
    reset,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<CreateItemInventarioInput>({
    resolver: zodResolver(CreateItemInventarioSchema) as any,
    defaultValues: {
      espacioId,
      codigo: '',
      nombre: '',
      categoria: 'TECNOLOGIA',
      cantidad: 1,
      estado: 'OPTIMO',
      esCritico: false,
      descripcion: '',
    },
  });

  // 3. Mutación Crear / Editar
  const saveMutation = useMutation({
    mutationFn: async (data: CreateItemInventarioInput) => {
      if (editingItem) {
        return inventarioApi.update(editingItem.id, data);
      } else {
        return inventarioApi.create(data);
      }
    },
    onSuccess: () => {
      toast.success(
        editingItem
          ? 'Implemento actualizado exitosamente'
          : 'Implemento agregado al inventario',
      );
      queryClient.invalidateQueries({ queryKey: ['inventario-espacio', espacioId] });
      handleCloseModal();
    },
    onError: (err: unknown) => {
      const msg =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : 'Error al guardar el implemento';
      toast.error(msg);
    },
  });

  // 4. Mutación Eliminar (Dar de baja)
  const removeMutation = useMutation({
    mutationFn: (id: number) => inventarioApi.remove(id),
    onSuccess: () => {
      toast.success('Implemento marcado como dado de baja');
      queryClient.invalidateQueries({ queryKey: ['inventario-espacio', espacioId] });
    },
    onError: (err: unknown) => {
      const msg =
        err instanceof ApiError ? err.message : 'Error al dar de baja el implemento';
      toast.error(msg);
    },
  });

  const handleOpenCreate = () => {
    setEditingItem(null);
    reset({
      espacioId,
      codigo: '',
      nombre: '',
      categoria: 'TECNOLOGIA',
      cantidad: 1,
      estado: 'OPTIMO',
      esCritico: false,
      descripcion: '',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: any) => {
    setEditingItem(item);
    reset({
      espacioId,
      codigo: item.codigo,
      nombre: item.nombre,
      categoria: item.categoria,
      cantidad: item.cantidad,
      estado: item.estado,
      esCritico: item.esCritico,
      descripcion: item.descripcion || '',
    });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingItem(null);
  };

  const onSubmit = async (data: CreateItemInventarioInput) => {
    await saveMutation.mutateAsync(data);
  };

  const getCategoryIcon = (categoria: CategoriaItem) => {
    switch (categoria) {
      case 'TECNOLOGIA':
        return <Laptop className="h-4 w-4 text-sky-600" />;
      case 'DEPORTIVO':
        return <Trophy className="h-4 w-4 text-amber-600" />;
      case 'MOBILIARIO':
        return <Armchair className="h-4 w-4 text-emerald-600" />;
      case 'DIDACTICO':
        return <BookOpen className="h-4 w-4 text-indigo-600" />;
      default:
        return <Info className="h-4 w-4 text-slate-600" />;
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6">
      {/* Header del Tab */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-slate-100">
        <div>
          <h3 className="text-lg font-bold text-slate-900">
            Ficha de Inventario Asignado
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Implementos pedagógicos, tecnológicos y deportivos bajo custodia del espacio.
          </p>
        </div>

        {canManage && (
          <button
            type="button"
            onClick={handleOpenCreate}
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl shadow-xs transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>Agregar Implemento</span>
          </button>
        )}
      </div>

      {/* Contenido de la Lista */}
      <div className="mt-5">
        {isLoading ? (
          <div className="py-12 flex flex-col items-center justify-center text-slate-500">
            <Loader2 className="h-7 w-7 animate-spin text-emerald-700 mb-2" />
            <span className="text-xs">Cargando inventario...</span>
          </div>
        ) : error ? (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs">
            Error al consultar el inventario asignado.
          </div>
        ) : items?.length === 0 ? (
          <div className="text-center py-10 text-slate-500 bg-slate-50 rounded-xl border border-dashed border-slate-200">
            <p className="text-xs">No hay implementos registrados en este espacio físico.</p>
            {canManage && (
              <button
                type="button"
                onClick={handleOpenCreate}
                className="mt-3 text-xs font-bold text-emerald-700 hover:underline"
              >
                + Registrar el primer implemento
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="pb-3">Implemento</th>
                  <th className="pb-3">Código / Placa</th>
                  <th className="pb-3">Categoría</th>
                  <th className="pb-3 text-center">Cantidad</th>
                  <th className="pb-3">Estado</th>
                  <th className="pb-3">Criticidad</th>
                  {canManage && <th className="pb-3 text-right">Acciones</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items?.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 font-semibold text-slate-900">
                      <div>{item.nombre}</div>
                      {item.descripcion && (
                        <div className="text-[11px] text-slate-400 font-normal mt-0.5">
                          {item.descripcion}
                        </div>
                      )}
                    </td>
                    <td className="py-3 font-mono font-medium text-slate-700">
                      {item.codigo}
                    </td>
                    <td className="py-3">
                      <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700">
                        {getCategoryIcon(item.categoria)}
                        <span>{item.categoria}</span>
                      </span>
                    </td>
                    <td className="py-3 text-center font-bold text-slate-800">
                      {item.cantidad}
                    </td>
                    <td className="py-3">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          item.estado === 'OPTIMO'
                            ? 'bg-emerald-100 text-emerald-800'
                            : item.estado === 'REGULAR'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {item.estado}
                      </span>
                    </td>
                    <td className="py-3">
                      {item.esCritico ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-50 border border-rose-200 text-rose-700">
                          Crítico
                        </span>
                      ) : (
                        <span className="text-slate-400 text-[11px]">Estándar</span>
                      )}
                    </td>
                    {canManage && (
                      <td className="py-3 text-right space-x-1">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(item)}
                          className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors"
                          title="Editar implemento"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (
                              confirm(
                                `¿Seguro que deseas dar de baja el implemento "${item.nombre}"?`,
                              )
                            ) {
                              removeMutation.mutate(item.id);
                            }
                          }}
                          className="p-1.5 text-slate-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Dar de baja"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Crear / Editar Implemento */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">
                {editingItem ? 'Editar Implemento' : 'Nuevo Implemento de Inventario'}
              </h3>
              <button
                type="button"
                onClick={handleCloseModal}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit as any)} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Nombre del Implemento
                </label>
                <input
                  type="text"
                  placeholder="Ej: Smart TV 65 pulgadas / Balón Baloncesto #7"
                  {...register('nombre')}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white text-slate-900 focus:ring-2 focus:ring-emerald-600 outline-none"
                />
                {errors.nombre && (
                  <p className="mt-1 text-rose-600">{errors.nombre.message}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Código / Placa
                  </label>
                  <input
                    type="text"
                    placeholder="Ej: POLI-TV-01"
                    {...register('codigo')}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white text-slate-900 focus:ring-2 focus:ring-emerald-600 outline-none"
                  />
                  {errors.codigo && (
                    <p className="mt-1 text-rose-600">{errors.codigo.message}</p>
                  )}
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Categoría
                  </label>
                  <select
                    {...register('categoria')}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white text-slate-900 focus:ring-2 focus:ring-emerald-600 outline-none"
                  >
                    <option value="TECNOLOGIA">Tecnología</option>
                    <option value="MOBILIARIO">Mobiliario</option>
                    <option value="DEPORTIVO">Deportivo</option>
                    <option value="DIDACTICO">Didáctico</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Cantidad
                  </label>
                  <input
                    type="number"
                    min={1}
                    {...register('cantidad', { valueAsNumber: true })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white text-slate-900 focus:ring-2 focus:ring-emerald-600 outline-none"
                  />
                  {errors.cantidad && (
                    <p className="mt-1 text-rose-600">{errors.cantidad.message}</p>
                  )}
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Estado Inicial
                  </label>
                  <select
                    {...register('estado')}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white text-slate-900 focus:ring-2 focus:ring-emerald-600 outline-none"
                  >
                    <option value="OPTIMO">Óptimo</option>
                    <option value="REGULAR">Regular</option>
                    <option value="DANADO">Dañado</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Descripción / Especificaciones
                </label>
                <textarea
                  rows={2}
                  placeholder="Marca, modelo, serie o instrucciones de uso..."
                  {...register('descripcion')}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white text-slate-900 focus:ring-2 focus:ring-emerald-600 outline-none"
                />
              </div>

              <div className="flex items-center space-x-2 pt-1">
                <input
                  type="checkbox"
                  id="esCritico"
                  {...register('esCritico')}
                  className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 h-4 w-4"
                />
                <label htmlFor="esCritico" className="text-slate-700 font-semibold cursor-pointer">
                  Ítem Crítico (Exige verificación obligatoria prioritaria)
                </label>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center space-x-1.5 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl shadow-xs transition-colors"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
                      Guardando...
                    </>
                  ) : (
                    <span>{editingItem ? 'Actualizar' : 'Guardar Implemento'}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
