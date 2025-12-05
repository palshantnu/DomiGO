import {
    useCallback,
    useEffect,
    useRef,
    useState,
} from 'react'

const useAPI = (storeResponse = false) => {
    const [data, setData] = useState(null)
    const [error, setError] = useState(null)
    const apiAbortController = useRef(null)
    const [loading, setLoading] = useState(false)

    // Unmount
    useEffect(() => abortAPI, [])

    // Initialize Abort
    const initApiSignal = useCallback(() => new Promise((resolve) => {
        const controller = new AbortController()
        apiAbortController.current = controller
        resolve(controller?.signal)
    }), [])

    // Abort API
    const abortAPI = useCallback(() => {
        apiAbortController?.current?.abort()
    }, [])

    // Call API
    const callApi = useCallback((func) => new Promise((resolve, reject) => {
        setLoading(true)
        func?.then((res) => {
            if (storeResponse) setData(res);
            resolve(res)
        })?.catch((errorRes) => {
            if (storeResponse) setError(errorRes)
            reject(errorRes)
        })?.finally(() => {
            setLoading(false)
        })
    }), [storeResponse])

    return {
        data,
        error,
        loading,
        setLoading,
        callApi,
        initApiSignal,
        abortAPI,
    }
}

export default useAPI
