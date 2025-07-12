"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Plus, Edit2, Trash2, Clock, AlertCircle, X } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  createAppointmentTypeAction,
  updateAppointmentTypeAction,
  deleteAppointmentTypeAction,
  toggleAppointmentTypeAction,
  getAllAppointmentTypesAction,
  type CreateAppointmentTypeData,
  type UpdateAppointmentTypeData 
} from "@/app/admin/event-types/server/actions";
import { type AppointmentType } from "@/lib/schemas/database";

interface FormData {
  name: string;
  description: string;
  durationMinutes: number;
}

const DEFAULT_FORM_DATA: FormData = {
  name: "",
  description: "",
  durationMinutes: 30,
};

export function AppointmentTypeManager() {
  const [appointmentTypes, setAppointmentTypes] = useState<AppointmentType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingType, setEditingType] = useState<AppointmentType | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formData, setFormData] = useState<FormData>(DEFAULT_FORM_DATA);

  const loadAppointmentTypes = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const types = await getAllAppointmentTypesAction();
      setAppointmentTypes(types);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load appointment types");
    } finally {
      setIsLoading(false);
    }
  };

  // Load appointment types on component mount
  useEffect(() => {
    void loadAppointmentTypes();
  }, []);

  const handleCreate = () => {
    setEditingType(null);
    setFormData(DEFAULT_FORM_DATA);
    setIsFormOpen(true);
  };

  const handleEdit = (appointmentType: AppointmentType) => {
    setEditingType(appointmentType);
    setFormData({
      name: appointmentType.name,
      description: appointmentType.description ?? "",
      durationMinutes: appointmentType.durationMinutes,
    });
    setIsFormOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this appointment type?")) {
      return;
    }

    try {
      setIsSubmitting(true);
      const result = await deleteAppointmentTypeAction(id);
      if (!result.success) {
        setError(result.error ?? "Failed to delete appointment type");
        return;
      }
      
      await loadAppointmentTypes();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete appointment type");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggle = async (id: string) => {
    try {
      setIsSubmitting(true);
      const result = await toggleAppointmentTypeAction(id);
      if (!result.success) {
        setError(result.error ?? "Failed to toggle appointment type");
        return;
      }
      
      await loadAppointmentTypes();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to toggle appointment type");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      setError("Name is required");
      return;
    }

    if (formData.durationMinutes < 1 || formData.durationMinutes > 480) {
      setError("Duration must be between 1 and 480 minutes");
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      if (editingType) {
        // Update existing
        const updateData: UpdateAppointmentTypeData = {
          id: editingType.id,
          name: formData.name.trim(),
          description: formData.description.trim() || undefined,
          durationMinutes: formData.durationMinutes,
          isActive: editingType.isActive,
        };

        const result = await updateAppointmentTypeAction(updateData);
        if (!result.success) {
          setError(result.error ?? "Failed to update appointment type");
          return;
        }
      } else {
        // Create new
        const createData: CreateAppointmentTypeData = {
          name: formData.name.trim(),
          description: formData.description.trim() || undefined,
          durationMinutes: formData.durationMinutes,
        };

        const result = await createAppointmentTypeAction(createData);
        if (!result.success) {
          setError(result.error ?? "Failed to create appointment type");
          return;
        }
      }

      setIsFormOpen(false);
      setEditingType(null);
      setFormData(DEFAULT_FORM_DATA);
      await loadAppointmentTypes();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save appointment type");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setIsFormOpen(false);
    setEditingType(null);
    setFormData(DEFAULT_FORM_DATA);
    setError(null);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading appointment types...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Header */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Appointment Types</h3>
        <Button onClick={handleCreate} disabled={isSubmitting}>
          <Plus className="h-4 w-4 mr-2" />
          Add Appointment Type
        </Button>
      </div>

      {/* Form */}
      {isFormOpen && (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>
                {editingType ? "Edit Appointment Type" : "Create Appointment Type"}
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={handleCancel} disabled={isSubmitting}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Quick Chat, Strategy Session"
                disabled={isSubmitting}
              />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Brief description of this appointment type"
                disabled={isSubmitting}
              />
            </div>
            <div>
              <Label htmlFor="duration">Duration (minutes)</Label>
              <Input
                id="duration"
                type="number"
                value={formData.durationMinutes}
                onChange={(e) => setFormData(prev => ({ ...prev, durationMinutes: parseInt(e.target.value) || 30 }))}
                min="1"
                max="480"
                disabled={isSubmitting}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={handleCancel} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : editingType ? "Update" : "Create"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* List */}
      <div className="grid gap-4">
        {appointmentTypes.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-gray-500">No appointment types configured yet.</p>
              <Button onClick={handleCreate} className="mt-4">
                <Plus className="h-4 w-4 mr-2" />
                Create your first appointment type
              </Button>
            </CardContent>
          </Card>
        ) : (
          appointmentTypes.map((appointmentType) => (
            <Card key={appointmentType.id} className={`${appointmentType.isActive ? 'border-l-4 border-l-blue-500' : 'opacity-60'}`}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">{appointmentType.name}</CardTitle>
                    <CardDescription>{appointmentType.description}</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={appointmentType.isActive}
                      onCheckedChange={() => handleToggle(appointmentType.id)}
                      disabled={isSubmitting}
                    />
                    <Button variant="ghost" size="sm" onClick={() => handleEdit(appointmentType)} disabled={isSubmitting}>
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(appointmentType.id)} disabled={isSubmitting}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  <Badge variant="secondary">{appointmentType.durationMinutes} minutes</Badge>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}