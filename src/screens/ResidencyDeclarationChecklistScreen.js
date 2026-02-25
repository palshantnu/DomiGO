import React, { useState } from "react";
import {
  View,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity
} from "react-native";
import LinearGradient from "react-native-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import Header from "../components/Header";
import YesNoToggle from "../components/YesNoToggle";
import SectionCard from "../components/SectionCard";
import DateInput from "../components/DateInput";
import DocumentUpload from "../components/DocumentUpload";
import MultiEntryBlock from "../components/MultiEntryBlock";
import colors from "../theme/colors";

const initialState = {
    declaration: { enabled: false, date: "" },
  
    addressRecord: {
      enabled: false,
      establishedDate: "",
      address: "",
      ownProperty: null
    },
  
    propertyExemptions: {
      enabled: false,
      startDate: "",
      type: ""
    },
  
    driversLicense: {
      enabled: false,
      issueDate: "",
      state: "",
      number: "",
      document: null
    },
  
    voting: {
      enabled: false,
      registrationDate: "",
      state: "",
      county: "",
      city: "",
      document: null
    },
  
    workLocation: {
      enabled: false,
      startDate: "",
      address: "",
      document: null
    },
  
    primaryDoctor: {
      enabled: false,
      startDate: "",
      address: ""
    },
  
    taxFiling: {
      enabled: false,
      lastFileDate: "",
      yearsFiled: "",
      state: ""
    },
  
    businessRecords: [],
  
    secondHomes: []
  };

const ResidencyDeclarationChecklistScreen = () => {

  const [form, setForm] = useState(initialState);

  const updateSection = (section, key, value) => {
    setForm(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: value
      }
    }));
  };

  const addBusiness = () => {
    setForm(prev => ({
      ...prev,
      businessRecords: [
        ...prev.businessRecords,
        {
          name: "",
          startDate: "",
          registrationNumber: "",
          dissolutionDate: ""
        }
      ]
    }));
  };

  const addSecondHome = () => {
    setForm(prev => ({
      ...prev,
      secondHomes: [
        ...prev.secondHomes,
        {
          establishedDate: "",
          address: "",
          ownProperty: null,
          exemptions: null,
          dissolutionDate: ""
        }
      ]
    }));
  };

  const validateAndSubmit = () => {
    if (form.declaration.enabled && !form.declaration.date)
      return alert("Declaration date required");

    if (form.driversLicense.enabled && !form.driversLicense.issueDate)
      return alert("License issue date required");

    console.log("FINAL PAYLOAD:", form);
  };

  return (
    <LinearGradient colors={["#9ab1fa", "#ffffff"]} style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }}>
        <Header title="Residency Enterprise Checklist" />

        <ScrollView style={{ padding: 16 }}>

          {/* Declaration */}
          <SectionCard title="Declaration of Residency">
            <YesNoToggle
              value={form.declaration.enabled}
              onChange={(val) =>
                updateSection("declaration", "enabled", val)
              }
            />

            {form.declaration.enabled && (
              <>
                <Text>Date of Declaration</Text>
                <DateInput
                  value={form.declaration.date}
                  onChange={(val) =>
                    updateSection("declaration", "date", val)
                  }
                />
              </>
            )}
          </SectionCard>

          {/* Drivers License */}
          <SectionCard title="Driver’s License">
            <YesNoToggle
              value={form.driversLicense.enabled}
              onChange={(val) =>
                updateSection("driversLicense", "enabled", val)
              }
            />

            {form.driversLicense.enabled && (
              <>
                <Text>Issue Date</Text>
                <DateInput
                  value={form.driversLicense.issueDate}
                  onChange={(val) =>
                    updateSection("driversLicense", "issueDate", val)
                  }
                />

                <Text>Issuing State</Text>
                <TextInput
                  style={{ borderBottomWidth: 1, marginBottom: 10 }}
                  value={form.driversLicense.state}
                  onChangeText={(val) =>
                    updateSection("driversLicense", "state", val)
                  }
                />

                <Text>License Number (Optional)</Text>
                <TextInput
                  style={{ borderBottomWidth: 1, marginBottom: 10 }}
                  value={form.driversLicense.number}
                  onChangeText={(val) =>
                    updateSection("driversLicense", "number", val)
                  }
                />

                <DocumentUpload
                  value={form.driversLicense.document}
                  onChange={(file) =>
                    updateSection("driversLicense", "document", file)
                  }
                />
              </>
            )}
          </SectionCard>

          {/* Business Records */}
          <SectionCard title="Business Records">
            <TouchableOpacity
              onPress={addBusiness}
              style={{
                backgroundColor: colors.primary,
                padding: 10,
                borderRadius: 20,
                alignItems: "center",
                marginBottom: 10
              }}
            >
              <Text style={{ color: "#fff" }}>Add Business</Text>
            </TouchableOpacity>

            <MultiEntryBlock
              data={form.businessRecords}
              type="business"
              setForm={setForm}
            />
          </SectionCard>

          {/* Second Homes */}
          <SectionCard title="Second Homes / Multi-State Residency">
            <TouchableOpacity
              onPress={addSecondHome}
              style={{
                backgroundColor: colors.primary,
                padding: 10,
                borderRadius: 20,
                alignItems: "center",
                marginBottom: 10
              }}
            >
              <Text style={{ color: "#fff" }}>Add Second Home</Text>
            </TouchableOpacity>

            <MultiEntryBlock
              data={form.secondHomes}
              type="secondHome"
              setForm={setForm}
            />
          </SectionCard>

          <TouchableOpacity
            onPress={validateAndSubmit}
            style={{
              backgroundColor: colors.primary,
              padding: 18,
              borderRadius: 30,
              alignItems: "center",
              marginTop: 20,
              marginBottom: 40
            }}
          >
            <Text style={{ color: "#fff", fontWeight: "700" }}>
              Save Enterprise Checklist
            </Text>
          </TouchableOpacity>

        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
};

export default ResidencyDeclarationChecklistScreen;