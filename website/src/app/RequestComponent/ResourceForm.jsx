import React, { useEffect, useState, useCallback } from "react";
import { PlusCircle, AlertCircle } from "lucide-react";
import { RESOURCE_TYPES } from "../utils/resourceType";
import { validateQuantity } from "../utils/validation";
import debounce from "lodash.debounce";

export default function ResourceForm({ onRequestCreated }) {
  const [type, setType] = useState("");
  const [quantity, setQuantity] = useState("");
  const [description, setDescription] = useState("");
  const [quantityError, setQuantityError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [udiseId, setUdiseId] = useState(null);
  const [schoolName, setSchoolName] = useState("");

  useEffect(() => {
    const fetchSchoolName = async () => {
      try {
        const id = sessionStorage.getItem("udiseId");
        if (!id) {
          console.error("No UDISE ID found in session storage.");
          return;
        }

        setUdiseId(id);

        const response = await fetch(
          `/api/resource-request/principal/get-name?udise_code=${id}`
        );

        if (!response.ok) {
          console.error("Failed to fetch school name:", response.statusText);
          return;
        }

        const data = await response.json();
        if (data?.School_Name) {
          setSchoolName(data.School_Name);
          console.log("Fetched School Name:", data.School_Name);
        } else {
          console.error("School name not found in response.");
        }
      } catch (error) {
        console.error("Error fetching school name:", error);
      }
    };

    fetchSchoolName();
  }, []);

  const handleQuantityChange = (e) => {
    const inputValue = e.target.value;
    setQuantity(inputValue); // Update the quantity immediately
    if (type) {
      debouncedValidation(inputValue); // Only debounce validation
    }
  };

  const debouncedValidation = useCallback(
    debounce((inputValue) => {
      const validation = validateQuantity(type, inputValue);
      setQuantityError(validation.isValid ? "" : validation.error);
    }, 300),
    [type]
  );

  const handleTypeChange = (e) => {
    const newType = e.target.value;
    setType(newType);
    if (quantity) {
      const validation = validateQuantity(newType, quantity);
      setQuantityError(validation.isValid ? "" : validation.error);
    }
  };

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();

      if (!udiseId || !schoolName) {
        console.error("Missing UDISE ID or School Name.");
        return;
      }

      if (!type || quantityError) return;

      const validation = validateQuantity(type, quantity);
      if (!validation.isValid) {
        setQuantityError(validation.error);
        return;
      }

      setIsSubmitting(true);
      try {
        const response = await fetch(
          "/api/resource-request/principal/create",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              UDISE_CODE: udiseId,
              School_Name: schoolName, // Include school name in the payload
              resource_type: type,
              quantity: parseInt(quantity, 10),
              description: description,
              adminId: "admin_1",
            }),
          }
        );

        if (!response.ok) {
          console.error(
            "Failed to create new resource request:",
            response.statusText
          );
          return;
        }

        const responseData = await response.json();
        console.log("Newly created resource request:", responseData);
        onRequestCreated(responseData);

        // Reset form
        setType("");
        setQuantity("");
        setDescription("");
        setQuantityError("");
      } catch (error) {
        console.error("Failed to create request:", error);
      } finally {
        setIsSubmitting(false);
      }
    },
    [udiseId, schoolName, type, quantity, description, quantityError, onRequestCreated]
  );

  return (
    <form onSubmit={handleSubmit} className="card">
      <h2 className="text-2xl font-semibold mb-8 pb-4 border-b border-gray-100">
        New Resource Request
      </h2>

      <div className="space-y-6">
        <div>
          <label className="form-label">Resource Type</label>
          <select
            value={type}
            onChange={handleTypeChange}
            className="form-input"
            required
            disabled={isSubmitting}
          >
            <option value="">Select a resource type</option>
            {RESOURCE_TYPES.map((resource) => (
              <option key={resource.label} value={resource.label}>
                {resource.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="form-label">Quantity</label>
          <input
            type="text"
            value={quantity}
            onChange={handleQuantityChange}
            className={`form-input ${
              quantityError ? "border-red-300 focus:ring-red-500" : ""
            }`}
            required
            disabled={isSubmitting}
            placeholder={
              type
                ? `Enter quantity in ${
                    RESOURCE_TYPES.find((r) => r.label === type)?.unit || "units"
                  }`
                : "Select a resource type first"
            }
          />
          {quantityError && (
            <div className="mt-2 flex items-center text-sm text-red-600">
              <AlertCircle className="w-4 h-4 mr-1" />
              {quantityError}
            </div>
          )}
        </div>

        <div>
          <label className="form-label">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="form-input min-h-[120px] resize-none"
            required
            disabled={isSubmitting}
            placeholder="Provide additional details about your request..."
          />
        </div>

        <button
          type="submit"
          className="btn-primary mt-8"
          disabled={isSubmitting || !!quantityError}
        >
          <PlusCircle className="w-5 h-5 mr-2" />
          {isSubmitting ? "Submitting..." : "Submit Request"}
        </button>
      </div>
    </form>
  );
}
