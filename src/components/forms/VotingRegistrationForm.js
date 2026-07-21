import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    TextInput,
    Image,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import DatePicker from 'react-native-date-picker';
import { pick } from '@react-native-documents/picker';
import AttachmentPicker from '../common/AttachmentPicker';

const VotingRegistrationForm = ({ data, onChange, userData }) => {
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
            <Text style={styles.label}>Registration Date *</Text>
            <TouchableOpacity
                style={styles.inputContainer}
                onPress={() => setOpenDatePicker(true)}
            >
                <Ionicons name="calendar-outline" size={20} color="#9E9EA7" />
                <Text style={[styles.input, !data.registrationDate && styles.placeholder]}>
                    {data.registrationDate || "Select Date"}
                </Text>
            </TouchableOpacity>

            <Text style={styles.label}>Registered State *</Text>
            <View style={styles.inputContainer}>
                <Ionicons name="flag-outline" size={20} color="#9E9EA7" />
                <TextInput
                    style={styles.input}
                    placeholder="Enter state"
                    placeholderTextColor="#A8A8A8"
                    // value={data.state}
                    value={!data?.state ? userData?.state : data?.state || ''}
                    onChangeText={(val) => updateField('state', val)}
                />
            </View>

            {/* <Text style={styles.label}>Registered County *</Text>
            <View style={styles.inputContainer}>
                <Ionicons name="location-outline" size={20} color="#9E9EA7" />
                <TextInput
                    style={styles.input}
                    placeholder="Enter county"
                    placeholderTextColor="#A8A8A8"
                    value={data.county}
                    onChangeText={(val) => updateField('county', val)}
                />
            </View> */}

            <Text style={styles.label}>Registered City *</Text>
            <View style={styles.inputContainer}>
                <Ionicons name="business-outline" size={20} color="#9E9EA7" />
                <TextInput
                    style={styles.input}
                    placeholder="Enter city"
                    placeholderTextColor="#A8A8A8"
                    // value={data.city}
                    value={!data?.city ? userData?.city : data?.city || ''}
                    onChangeText={(val) => updateField('city', val)}
                />
            </View>

            <Text style={styles.label}>Document</Text>
            {/* <TouchableOpacity 
                style={styles.inputContainer}
                onPress={pickDocument}
            >
                <Ionicons name="cloud-upload-outline" size={20} color="#9E9EA7" />
                <Text style={[styles.input, !data.document && styles.placeholder]}>
                    {data.document?.name || "Upload PDF / Image"}
                </Text>
            </TouchableOpacity> */}
            <AttachmentPicker
                value={data.document}
                onChange={(file) => updateField("document", file)}
                style={styles.inputContainer}
            />
            {
                data.document?.uri && (
                    <Image
                        source={{ uri: data.document.uri }}
                        style={{
                            width: 90,
                            height: 90,
                            borderRadius: 8,
                            marginTop: 10,
                        }}
                    />
                )
            }

            <Text style={styles.disclaimer}>* Please save this information at your own discretion</Text>

            <DatePicker
                modal
                mode="date"
                open={openDatePicker}
                date={data.registrationDate ? new Date(data.registrationDate) : new Date()}
                onConfirm={(date) => {
                    updateField('registrationDate', date.toLocaleDateString("en-CA").slice(0, 10));
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

export default VotingRegistrationForm;