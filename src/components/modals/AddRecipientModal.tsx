import React, { useState, useEffect } from 'react';
import {
  X,
  Building2,
  MapPin,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Scale,
  Truck,
  Phone,
  User,
  Info,
  Save,
  Plus,
} from 'lucide-react';
import { RecipientVerificationStatus, RedistributionPartner } from '../../types';
import { useApp } from '../../context/AppContext';

interface AddRecipientModalProps {
  isOpen: boolean;
  onClose: () => void;
  partnerToEdit?: RedistributionPartner | null;
}

const ALL_FOOD_TYPES = [
  'Cooked Main Meals',
  'Rice & Breads',
  'Soups & Gravies',
  'Bakery Goods',
  'Fresh Cut Produce',
  'Dairy Items',
  'Packaged Dry Goods',
  'Defective / Expired Batches (Compost Only)',
];

export const AddRecipientModal: React.FC<AddRecipientModalProps> = ({
  isOpen,
  onClose,
  partnerToEdit,
}) => {
  const { addRecipient, updateRecipient } = useApp();

  const [name, setName] = useState('');
  const [type, setType] = useState('Campus Student Pantry');
  const [location, setLocation] = useState('');
  const [serviceCapacity, setServiceCapacity] = useState('');
  const [acceptedFoodTypes, setAcceptedFoodTypes] = useState<string[]>([
    'Cooked Main Meals',
    'Rice & Breads',
  ]);
  const [operatingHours, setOperatingHours] = useState('11:00 - 20:00 Daily');
  const [verificationStatus, setVerificationStatus] =
    useState<RecipientVerificationStatus>('Verified Institutional Partner');
  const [contactPerson, setContactPerson] = useState('');
  const [phone, setPhone] = useState('');
  const [pickupAvailability, setPickupAvailability] = useState('Has Own Insulated Vehicle');
  const [distanceKm, setDistanceKm] = useState('2.5');
  const [notes, setNotes] = useState('');

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (partnerToEdit) {
      setName(partnerToEdit.name || '');
      setType(partnerToEdit.type || 'Campus Student Pantry');
      setLocation(partnerToEdit.location || '');
      setServiceCapacity(String(partnerToEdit.serviceCapacity || partnerToEdit.typicalCapacityKg || 50));
      setAcceptedFoodTypes(partnerToEdit.acceptedFoodTypes || ['Cooked Main Meals']);
      setOperatingHours(partnerToEdit.operatingHours || '11:00 - 20:00 Daily');
      setVerificationStatus(partnerToEdit.verificationStatus || 'Verified Institutional Partner');
      setContactPerson(partnerToEdit.contactPerson || '');
      setPhone(partnerToEdit.phone || '');
      setPickupAvailability(partnerToEdit.pickupAvailability || 'Has Own Insulated Vehicle');
      setDistanceKm(String(partnerToEdit.distanceKm || 2.5));
      setNotes(partnerToEdit.notes || '');
    } else {
      setName('');
      setType('Campus Student Pantry');
      setLocation('');
      setServiceCapacity('60');
      setAcceptedFoodTypes(['Cooked Main Meals', 'Rice & Breads']);
      setOperatingHours('11:00 - 20:00 Daily');
      setVerificationStatus('Verified Institutional Partner');
      setContactPerson('');
      setPhone('');
      setPickupAvailability('Has Own Insulated Vehicle');
      setDistanceKm('2.0');
      setNotes('');
    }
    setErrors({});
  }, [partnerToEdit, isOpen]);

  if (!isOpen) return null;

  const toggleFoodType = (t: string) => {
    setAcceptedFoodTypes(prev =>
      prev.includes(t) ? prev.filter(item => item !== t) : [...prev, t]
    );
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = 'Organization name is required';
    if (!location.trim()) errs.location = 'Address or campus location is required';
    const cap = parseFloat(serviceCapacity);
    if (isNaN(cap) || cap <= 0) errs.serviceCapacity = 'Daily capacity must be a positive number';
    if (acceptedFoodTypes.length === 0) errs.acceptedFoodTypes = 'Select at least one accepted food category';
    if (!operatingHours.trim()) errs.operatingHours = 'Operating hours are required';
    if (!contactPerson.trim()) errs.contactPerson = 'Contact person is required';

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const cap = parseFloat(serviceCapacity);
    const dist = parseFloat(distanceKm) || 2.5;

    if (partnerToEdit) {
      updateRecipient(partnerToEdit.id, {
        name,
        type,
        location,
        serviceCapacity: cap,
        typicalCapacityKg: cap,
        acceptedFoodTypes,
        operatingHours,
        preferredPickupWindow: operatingHours,
        verificationStatus,
        contactPerson,
        phone,
        pickupAvailability,
        distanceKm: dist,
        notes,
      });
    } else {
      addRecipient({
        name,
        type,
        location,
        serviceCapacity: cap,
        typicalCapacityKg: cap,
        acceptedFoodTypes,
        operatingHours,
        preferredPickupWindow: operatingHours,
        verificationStatus,
        contactPerson,
        phone,
        pickupAvailability,
        distanceKm: dist,
        isActive: true,
        allocatedTodayKg: 0,
        notes,
      });
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-6">
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-[#0b2b20] to-[#123e30] text-white flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-emerald-300" />
              <h3 className="text-base font-bold font-['Plus_Jakarta_Sans'] text-white">
                {partnerToEdit ? 'Edit Recipient Organization' : 'Enroll Internal Recipient Partner'}
              </h3>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              Internal institutional directory for safe chain-of-custody routing and capacity tracking.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Directory Notice */}
        <div className="bg-slate-100 border-b border-slate-200 px-5 py-2.5 flex items-center gap-2 text-xs text-slate-700">
          <Info className="w-4 h-4 text-slate-500 flex-shrink-0" />
          <span>
            <strong>Internal Directory Only:</strong> Recipients do not log in or interact with this portal. Records are maintained by institutional staff for dispatch and compliance.
          </span>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs max-h-[72vh] overflow-y-auto">
          {/* Org Name & Type */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="font-semibold text-slate-700 block mb-1">
                Organization Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Campus Annex Student Welfare Dining Hall"
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:ring-1 focus:ring-emerald-500 focus:outline-none"
              />
              {errors.name && <p className="text-rose-600 text-[11px] mt-0.5">{errors.name}</p>}
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Facility Type</label>
              <select
                value={type}
                onChange={e => setType(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:ring-1 focus:ring-emerald-500 focus:outline-none"
              >
                <option value="Campus Student Pantry">Campus Student Pantry</option>
                <option value="Community Kitchen">Community Kitchen</option>
                <option value="Elder Care Home">Elder Care Home</option>
                <option value="Shelter / Welfare Center">Shelter / Welfare Center</option>
                <option value="Partner Health Center">Partner Health Center</option>
                <option value="Sister Facility Dining">Sister Facility Dining</option>
                <option value="Municipal Community Center">Municipal Community Center</option>
                <option value="Eco-Compost Facility">Eco-Compost Facility</option>
              </select>
            </div>
          </div>

          {/* Location & Distance */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="font-semibold text-slate-700 block mb-1">
                Location / Campus Address <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. West Campus Gate 3, Student Center Ground Floor"
                value={location}
                onChange={e => setLocation(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:ring-1 focus:ring-emerald-500 focus:outline-none"
              />
              {errors.location && <p className="text-rose-600 text-[11px] mt-0.5">{errors.location}</p>}
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                Transit Distance (km)
              </label>
              <input
                type="number"
                step="0.1"
                min="0.1"
                value={distanceKm}
                onChange={e => setDistanceKm(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-mono focus:bg-white focus:ring-1 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Service Capacity & Operating Hours */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                Daily Service Capacity (kg/day) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                step="1"
                min="5"
                required
                placeholder="e.g. 75"
                value={serviceCapacity}
                onChange={e => setServiceCapacity(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-mono focus:bg-white focus:ring-1 focus:ring-emerald-500 focus:outline-none"
              />
              {errors.serviceCapacity && (
                <p className="text-rose-600 text-[11px] mt-0.5">{errors.serviceCapacity}</p>
              )}
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                Operating / Intake Hours <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. 11:00 - 21:00 Daily"
                value={operatingHours}
                onChange={e => setOperatingHours(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:ring-1 focus:ring-emerald-500 focus:outline-none"
              />
              {errors.operatingHours && (
                <p className="text-rose-600 text-[11px] mt-0.5">{errors.operatingHours}</p>
              )}
            </div>
          </div>

          {/* Accepted Food Types */}
          <div>
            <label className="font-semibold text-slate-700 block mb-1.5">
              Accepted Food Categories <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {ALL_FOOD_TYPES.map(ft => {
                const isSelected = acceptedFoodTypes.includes(ft);
                return (
                  <button
                    key={ft}
                    type="button"
                    onClick={() => toggleFoodType(ft)}
                    className={`p-2 rounded-lg border text-left text-[11px] font-medium transition-colors ${
                      isSelected
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-900 font-semibold'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <div
                        className={`w-3.5 h-3.5 rounded flex items-center justify-center text-[10px] ${
                          isSelected ? 'bg-emerald-700 text-white' : 'border border-slate-300'
                        }`}
                      >
                        {isSelected && '✓'}
                      </div>
                      <span className="truncate">{ft}</span>
                    </div>
                  </button>
                );
              })}
            </div>
            {errors.acceptedFoodTypes && (
              <p className="text-rose-600 text-[11px] mt-1">{errors.acceptedFoodTypes}</p>
            )}
          </div>

          {/* Verification Status & Logistics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                Verification & Audit Status
              </label>
              <select
                value={verificationStatus}
                onChange={e =>
                  setVerificationStatus(e.target.value as RecipientVerificationStatus)
                }
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:ring-1 focus:ring-emerald-500 focus:outline-none"
              >
                <option value="Verified Institutional Partner">Verified Institutional Partner</option>
                <option value="Pending Annual Audit">Pending Annual Audit</option>
                <option value="Conditional Clearance">Conditional Clearance</option>
                <option value="Inactive / Suspended">Inactive / Suspended</option>
              </select>
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                Pickup Transport Mode
              </label>
              <select
                value={pickupAvailability}
                onChange={e => setPickupAvailability(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:ring-1 focus:ring-emerald-500 focus:outline-none"
              >
                <option value="Has Own Insulated Vehicle">Has Own Insulated Vehicle</option>
                <option value="Thermal Cart Walker Available">Thermal Cart Walker Available</option>
                <option value="Requires Institutional Drop-off">Requires Institutional Drop-off</option>
              </select>
            </div>
          </div>

          {/* POC & Phone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                Authorized POC / Officer <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Aditi Rao (Student Welfare Officer)"
                value={contactPerson}
                onChange={e => setContactPerson(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:ring-1 focus:ring-emerald-500 focus:outline-none"
              />
              {errors.contactPerson && (
                <p className="text-rose-600 text-[11px] mt-0.5">{errors.contactPerson}</p>
              )}
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Contact Phone</label>
              <input
                type="text"
                placeholder="+91 98450 12345"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-mono focus:bg-white focus:ring-1 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="font-semibold text-slate-700 block mb-1">Internal Routing Notes</label>
            <textarea
              rows={2}
              placeholder="e.g. Direct underground walkway connection; 10 min transit with thermal cart."
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:ring-1 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          {/* Actions */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 font-semibold rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-lg shadow-xs transition-colors flex items-center gap-1.5"
            >
              {partnerToEdit ? <Save className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              <span>{partnerToEdit ? 'Save Changes' : 'Enroll Recipient'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
