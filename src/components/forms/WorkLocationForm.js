import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import DatePicker from 'react-native-date-picker';
import { pick } from '@react-native-documents/picker';
import GoogleAutoComplete from '../../components/GoogleAutoComplete';
import { GOOGLE_KEY } from '../../helpers/CommonHelpers';

const WorkLocationForm = ({ data, onChange }) => {
    const [openDatePicker, setOpenDatePicker] = useState(false);

    const updateField = (field, value) => {
        onChange({ ...data, [field]: value, enabled: true });
    };

    const pickDocument = async () => {
        try {
            const res = await pick({ allowMultiSelection: false });
            if (res?.[0]) {
                updateField('document', res[0]);
            }
        } catch (err) {
            console.log("Picker Error:", err);
        }
    };

    return (
        <View>
            <Text style={styles.label}>Start Date *</Text>
            <TouchableOpacity 
                style={styles.inputContainer}
                onPress={() => setOpenDatePicker(true)}
            >
                <Ionicons name="calendar-outline" size={20} color="#9E9EA7" />
                <Text style={[styles.input, !data.startDate && styles.placeholder]}>
                    {data.startDate || "Select Date"}
                </Text>
            </TouchableOpacity>

            <Text style={styles.label}>Work Address *</Text>
            <GoogleAutoComplete
                placeholder="Search Address"
                apiKey={GOOGLE_KEY}
                isResidence={false}
                value={data.address}
                onSelect={(value) => updateField('address', value)}
            />

            <Text style={styles.label}>Document</Text>
            <TouchableOpacity 
                style={styles.inputContainer}
                onPress={pickDocument}
            >
                <Ionicons name="cloud-upload-outline" size={20} color="#9E9EA7" />
                <Text style={[styles.input, !data.document && styles.placeholder]}>
                    {data.document?.name || "Upload PDF / Image"}
                </Text>
            </TouchableOpacity>

            <Text style={styles.disclaimer}>* Please save this information at your own discretion</Text>

            <DatePicker
                modal
                mode="date"
                open={openDatePicker}
                date={data.startDate ? new Date(data.startDate) : new Date()}
                onConfirm={(date) => {
                    updateField('startDate', date.toLocaleDateString("en-CA").slice(0, 10));
                    setOpenDatePicker(false);
                }}
                onCancel={() => setOpenDatePicker(false)}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    label: {
        fontSize: 14,
        fontWeight: "600",
        marginTop: 16,
        marginBottom: 8,
        color: "#333",
    },
    inputContainer: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#F8F8F8",
        borderRadius: 12,
        paddingHorizontal: 16,
        minHeight: 52,
        borderWidth: 1,
        borderColor: '#F0F0F0',
        marginBottom: 8,
    },
    input: {
        flex: 1,
        fontSize: 14,
        color: "#000",
        marginLeft: 12,
    },
    placeholder: {
        color: "#A8A8A8",
    },
    disclaimer: {
        fontSize: 12,
        color: '#999',
        fontStyle: 'italic',
        marginTop: 4,
        marginBottom: 8,
    },
});

export default WorkLocationForm;