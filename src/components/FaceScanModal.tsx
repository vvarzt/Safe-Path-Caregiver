import React, { useEffect, useRef, useState } from "react";
import {
    Modal,
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ActivityIndicator,
} from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { Ionicons } from "@expo/vector-icons";

interface Props {
    visible: boolean;
    onSuccess: () => void;
    onCancel: () => void;
}

export default function FaceScanModal({ visible, onSuccess, onCancel }: Props) {
    const [permission, requestPermission] = useCameraPermissions();
    const [status, setStatus] = useState<"idle" | "detecting" | "success">("idle");
    const cameraRef = useRef<CameraView>(null);
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    useEffect(() => {
        if (visible) {
            requestPermission();
            setStatus("idle");
            // รอกล้องเปิด 1.5 วิ แล้วเริ่ม scan
            timerRef.current = setTimeout(() => {
                startScanning();
            }, 1500);
        } else {
            stopAll();
        }
        return () => stopAll();
    }, [visible]);

    const stopAll = () => {
        if (timerRef.current) clearTimeout(timerRef.current);
        if (intervalRef.current) clearInterval(intervalRef.current);
        timerRef.current = null;
        intervalRef.current = null;
    };

    const startScanning = () => {
        setStatus("detecting");

        // ✅ ถ่ายรูปทุก 800ms เพื่อ "simulate" การสแกน
        // สามารถนำ uri ไปส่ง Face API จริงๆ ได้ในอนาคต
        let attempts = 0;
        intervalRef.current = setInterval(async () => {
            attempts++;
            try {
                if (!cameraRef.current) return;

                const photo = await cameraRef.current.takePictureAsync({
                    quality: 0.3,
                    skipProcessing: true,
                    base64: false,
                });

                console.log("📸 ถ่ายรูปสำเร็จ attempt:", attempts, photo?.uri);

                // ✅ ถ้าถ่ายรูปได้ = กล้องพร้อม = มีคนอยู่หน้ากล้อง
                // (ใส่ logic ตรวจ face จริงตรงนี้ได้)
                if (photo?.uri && attempts >= 2) {
                    stopAll();
                    setStatus("success");
                    setTimeout(() => onSuccess(), 800);
                }

            } catch (err) {
                console.log("📸 ยังไม่พร้อม:", err);
            }
        }, 800);
    };

    if (!permission) return null;

    return (
        <Modal visible={visible} animationType="slide" transparent>
            <View style={styles.overlay}>
                <View style={styles.container}>

                    <Text style={styles.title}>ยืนยันตัวตน</Text>
                    <Text style={styles.subtitle}>
                        กรุณามองตรงกล้องเพื่อยืนยันก่อนเริ่มงาน
                    </Text>

                    <View style={styles.cameraWrapper}>
                        {permission.granted ? (
                            <CameraView
                                ref={cameraRef}
                                style={styles.camera}
                                facing="front"
                            />
                        ) : (
                            <View style={styles.noPermission}>
                                <Ionicons name="camera-outline" size={40} color="#9CA3AF" />
                                <Text style={{ color: "#9CA3AF", marginTop: 8 }}>
                                    ไม่มีสิทธิ์เข้าถึงกล้อง
                                </Text>
                                <TouchableOpacity
                                    onPress={requestPermission}
                                    style={styles.permissionBtn}
                                >
                                    <Text style={{ color: "#fff" }}>อนุญาตกล้อง</Text>
                                </TouchableOpacity>
                            </View>
                        )}

                        {/* Frame Overlay */}
                        <View style={styles.frameOverlay}>
                            <View style={[
                                styles.frame,
                                status === "detecting" && { borderColor: "#F59E0B" },
                                status === "success" && { borderColor: "#10B981" },
                            ]} />
                        </View>

                        {/* Scan line animation เฉพาะตอน detecting */}
                        {status === "detecting" && (
                            <View style={styles.scanLineWrapper}>
                                <View style={styles.scanLine} />
                            </View>
                        )}
                    </View>

                    {/* Status */}
                    <View style={styles.statusBox}>
                        {status === "idle" && (
                            <>
                                <Ionicons name="scan-outline" size={22} color="#6B7280" />
                                <Text style={styles.statusText}>กำลังเปิดกล้อง...</Text>
                            </>
                        )}
                        {status === "detecting" && (
                            <>
                                <ActivityIndicator size="small" color="#F59E0B" />
                                <Text style={[styles.statusText, { color: "#F59E0B" }]}>
                                    กำลังสแกนใบหน้า...
                                </Text>
                            </>
                        )}
                        {status === "success" && (
                            <>
                                <Ionicons name="checkmark-circle" size={22} color="#10B981" />
                                <Text style={[styles.statusText, { color: "#10B981" }]}>
                                    ยืนยันสำเร็จ!
                                </Text>
                            </>
                        )}
                    </View>

                    <TouchableOpacity style={styles.cancelBtn} onPress={onCancel}>
                        <Text style={styles.cancelText}>ยกเลิก</Text>
                    </TouchableOpacity>

                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.6)",
        justifyContent: "flex-end",
    },
    container: {
        backgroundColor: "#fff",
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 24,
        alignItems: "center",
    },
    title: { fontSize: 18, fontWeight: "700", color: "#111827", marginBottom: 4 },
    subtitle: {
        fontSize: 13,
        color: "#6B7280",
        marginBottom: 16,
        textAlign: "center",
    },
    cameraWrapper: {
        width: 240,
        height: 300,
        borderRadius: 16,
        overflow: "hidden",
        backgroundColor: "#000",
        marginBottom: 16,
        position: "relative",
    },
    camera: { flex: 1 },
    frameOverlay: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: "center",
        alignItems: "center",
    },
    frame: {
        width: 160,
        height: 200,
        borderWidth: 2,
        borderColor: "rgba(255,255,255,0.6)",
        borderRadius: 100,
        borderStyle: "dashed",
    },
    scanLineWrapper: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: "center",
        alignItems: "center",
    },
    scanLine: {
        width: 140,
        height: 2,
        backgroundColor: "#F59E0B",
        opacity: 0.8,
    },
    noPermission: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#F3F4F6",
    },
    permissionBtn: {
        marginTop: 12,
        backgroundColor: "#43B7A5",
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 8,
    },
    statusBox: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        marginBottom: 20,
        minHeight: 28,
    },
    statusText: { fontSize: 14, color: "#6B7280", fontWeight: "500" },
    cancelBtn: {
        paddingVertical: 10,
        paddingHorizontal: 32,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: "#E5E7EB",
    },
    cancelText: { color: "#6B7280", fontWeight: "600" },
});