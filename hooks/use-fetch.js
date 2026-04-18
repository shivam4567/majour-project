const { useState } = require("react");
const { toast } = require("sonner");


const useFetch = (cb) => {
    const [data, setData] = useState(undefined);
    const [loading, setLoading] = useState(null);
    const [error, setError] = useState(null)

    const fn = async (...args) => {
        setLoading(true);
        setError(null);
        try {
            const response = await cb(...args);
            console.log('response', response);
            setData(response);
            setError(null);
        } catch (e) {
            setError(e);
            toast.error(e.message);

        } finally {
            setLoading(false);
        }
    }

    return {
        data, loading, error, fn, setData
    }
}

export default useFetch;