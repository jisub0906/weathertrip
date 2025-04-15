
export function handleSearchKeyword({
    searchTerm,
    mapRef,
    nearbyAttractions,
    setFilteredAttractions,
}) {
    if (!searchTerm.trim()) {
        setFilteredAttractions(nearbyAttractions);
        return;
    }

    const places = new window.kakao.maps.services.Places();

    places.keywordSearch(searchTerm, (data, status) => {
        if (status === window.kakao.maps.services.Status.OK && data.length > 0) {
            const match = data[0];
            const lat = parseFloat(match.y);
            const lng = parseFloat(match.x);

            if (mapRef.current?.moveToCoords) {
                mapRef.current.moveToCoords(lat, lng);
            }

            if (mapRef.current?.addSearchMarker) {
                mapRef.current.addSearchMarker(lat, lng);
            }

            const results = nearbyAttractions.filter(
                (item) =>
                    (item.name || "").includes(searchTerm) ||
                    (item.description || "").includes(searchTerm)
            );
            setFilteredAttractions(results);
        } else {
            alert("해당 장소를 찾을 수 없어요!");
        }
    });
}

export async function fetchKeywordLocation({ keyword, mapRef, setSelectedAttraction }) {
    if (!keyword) return;

    try {
        const res = await fetch(`/api/attractions/search?name=${encodeURIComponent(keyword)}`);
        const data = await res.json();

        if (data && data.attraction) {
            const lat = data.attraction["위도(도)"] || data.attraction.location?.coordinates?.[1];
            const lng = data.attraction["경도(도)"] || data.attraction.location?.coordinates?.[0];

            if (mapRef.current?.moveToCoords) {
                mapRef.current.moveToCoords(lat, lng);
            }

            if (mapRef.current?.addSearchMarker) {
                mapRef.current.addSearchMarker(lat, lng);
            }

            setSelectedAttraction(data.attraction);
        }
    } catch (err) {
        console.error("키워드 기반 관광지 검색 실패:", err);
    }
}

// 지도 중심 이동
export function moveToCoords(mapRef, lat, lng) {
    if (!mapRef?.current) return;

    const center = new window.kakao.maps.LatLng(lat, lng);
    mapRef.current.setCenter(center);
}

// 검색 마커 추가
export function addSearchMarker(mapRef, lat, lng) {
    if (!mapRef?.current) return;

    // 이전 마커가 있었다면 지우기
    if (mapRef.current.searchMarker) {
        mapRef.current.searchMarker.setMap(null);
    }

    const position = new window.kakao.maps.LatLng(lat, lng);
    const marker = new window.kakao.maps.Marker({
        position,
        map: mapRef.current,
        title: "검색 위치",
    });

    mapRef.current.searchMarker = marker;
}

