import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    TextInput,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import DatePicker from 'react-native-date-picker';
import { pick } from '@react-native-documents/picker';
import colors from '../../theme/colors';

const BusinessRecordsForm = ({ data, onChange }) => {
    const [openDatePicker, setOpenDatePicker] = useState(false);
    const [openDissolutionPicker, setOpenDissolutionPicker] = useState(false);

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
            <Text style={styles.label}>Have you registered an active business? *</Text>
            <View style={styles.yesNoContainer}>
                <TouchableOpacity
                    style={[
                        styles.yesNoButton,
                        data.isActive === true && styles.yesNoButtonActive
                    ]}
                    onPress={() => updateField('isActive', true)}
                >
                    <Text style={[
                        styles.yesNoText,
                        data.isActive === true && styles.yesNoTextActive
                    ]}>Yes</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                    style={[
                        styles.yesNoButton,
                        data.isActive === false && styles.yesNoButtonActive
                    ]}
                    onPress={() => updateField('isActive', false)}
                >
                    <Text style={[
                        styles.yesNoText,
                        data.isActive === false && styles.yesNoTextActive
                    ]}>No</Text>
                </TouchableOpacity>
            </View>

            {data.isActive && (
                <>
                    <Text style={styles.label}>Business Name *</Text>
                    <View style={styles.inputContainer}>
                        <Ionicons name="business-outline" size={20} color="#9E9EA7" />
                        <TextInput
                            style={styles.input}
                            placeholder="Enter business name"
                            placeholderTextColor="#A8A8A8"
                            value={data.name}
                            onChangeText={(val) => updateField('name', val)}
                        />
                    </View>

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

                    <Text style={styles.label}>Registration / File Number</Text>
                    <View style={styles.inputContainer}>
                        <Ionicons name="document-text-outline" size={20} color="#9E9EA7" />
                        <TextInput
                            style={styles.input}
                            placeholder="Enter registration number"
                            placeholderTextColor="#A8A8A8"
                            value={data.regNumber}
                            onChangeText={(val) => updateField('regNumber', val)}
                        />
                    </View>

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

                    <Text style={styles.label}>Dissolution Date (Optional)</Text>
                    <TouchableOpacity 
                        style={styles.inputContainer}
                        onPress={() => setOpenDissolutionPicker(true)}
                    >
                        <Ionicons name="calendar-outline" size={20} color="#9E9EA7" />
                        <Text style={[styles.input, !data.dissolutionDate && styles.placeholder]}>
                            {data.dissolutionDate || "Select Date"}
                        </Text>
                    </TouchableOpacity>
                </>
            )}

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

            <DatePicker
                modal
                mode="date"
                open={openDissolutionPicker}
                date={data.dissolutionDate ? new Date(data.dissolutionDate) : new Date()}
                onConfirm={(date) => {
                    updateField('dissolutionDate', date.toLocaleDateString("en-CA").slice(0, 10));
                    setOpenDissolutionPicker(false);
                }}
                onCancel={() => setOpenDissolutionPicker(false)}
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
    yesNoContainer: {
        flexDirection: 'row',
        marginBottom: 16,
    },
    yesNoButton: {
        flex: 1,
        paddingVertical: 14,
        backgroundColor: '#F5F5F5',
        borderRadius: 12,
        marginRight: 12,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E0E0E0',
    },
    yesNoButtonActive: {
        backgroundColor: colors.primary,
        borderColor: colors.primary,
    },
    yesNoText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#666',
    },
    yesNoTextActive: {
        color: '#fff',
    },
});

export default BusinessRecordsForm;