import React, { useState } from 'react';
import {
    ActivityIndicator,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

interface Props {
    section: string;
    option: string;
    onApply: (filterType: string, filterValue: string) => void;
    isLoading: boolean;
}

const movieGenres = ['Action', 'Thriller', 'Comedy', 'Horror', 'Romance', 'Sci-Fi'];
const tvGenres = ['Action', 'Adventure', 'Comedy', 'Crime', 'Sci-Fi'];
const languages = ['English', 'Spanish', 'Bengali', 'Korean', 'Hindi'];
const networks = ['Netflix', 'HBO', 'Amazon Prime', 'Disney+', 'Hulu', 'CW'];

export default function FilterControls({ section, option, onApply, isLoading }: Props) {
    const [releaseYear, setReleaseYear] = useState('');
    const [rating, setRating] = useState('');
    const [selectedGenre, setSelectedGenre] = useState<string | null>(null);
    const [selectedLanguage, setSelectedLanguage] = useState<string | null>(null);
    const [selectedNetwork, setSelectedNetwork] = useState<string | null>(null);

    if (section === 'Movie' && (option === 'Genre' || option === 'Language')) {
        const isGenre = option === 'Genre';
        const items = isGenre ? movieGenres : languages;
        const selectedItem = isGenre ? selectedGenre : selectedLanguage;
        const setSelectedItem = isGenre ? setSelectedGenre : setSelectedLanguage;

        return (
            <View style={styles.genreContainer}>
                {items.map((item) => (
                    <TouchableOpacity
                        key={item}
                        style={[styles.genreButton, selectedItem === item && styles.genreButtonSelected]}
                        onPress={() => {
                            setSelectedItem(item);
                            onApply(option, item);
                        }}
                        disabled={isLoading}
                    >
                        <Text style={[styles.genreText, selectedItem === item && styles.genreTextSelected]}>
                            {item}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>
        );
    }

    if (section === 'Movie' && (option === 'Release Year' || option === 'Rating Above')) {
        const value = option === 'Release Year' ? releaseYear : rating;
        const setValue = option === 'Release Year' ? setReleaseYear : setRating;
        const placeholder = option === 'Release Year' ? 'Enter year' : 'Enter rating (1-10)';

        return (
            <View style={styles.inputContainer}>
                <TextInput
                    style={styles.input}
                    placeholder={placeholder}
                    placeholderTextColor="#aaa"
                    keyboardType="numeric"
                    value={value}
                    onChangeText={setValue}
                    editable={!isLoading}
                />
                <TouchableOpacity
                    style={[styles.applyButton, isLoading && styles.disabledButton]}
                    onPress={() => value && onApply(option, value)}
                    disabled={isLoading}
                >
                    {isLoading
                        ? <ActivityIndicator size="small" color="#fff" />
                        : <Text style={styles.applyButtonText}>Apply</Text>}
                </TouchableOpacity>
            </View>
        );
    }

    if (section === 'TV Series') {
        if (option === 'Genre' || option === 'Language') {
            const isGenre = option === 'Genre';
            const items = isGenre ? tvGenres : languages;
            const [selectedItem, setSelectedItem] = isGenre ?
                [selectedGenre, setSelectedGenre] : [selectedLanguage, setSelectedLanguage];

            return (
                <View style={styles.genreContainer}>
                    {items.map((item) => (
                        <TouchableOpacity
                            key={item}
                            style={[styles.genreButton, selectedItem === item && styles.genreButtonSelected]}
                            onPress={() => {
                                setSelectedItem(item);
                                onApply(option, item);
                            }}
                            disabled={isLoading}
                        >
                            <Text style={[styles.genreText, selectedItem === item && styles.genreTextSelected]}>
                                {item}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            );
        }

        if (option === 'Release Year') {
            return (
                <View style={styles.inputContainer}>
                    <TextInput
                        style={styles.input}
                        placeholder="Enter year"
                        placeholderTextColor="#aaa"
                        keyboardType="numeric"
                        value={releaseYear}
                        onChangeText={setReleaseYear}
                        editable={!isLoading}
                    />
                    <TouchableOpacity
                        style={[styles.applyButton, isLoading && styles.disabledButton]}
                        onPress={() => releaseYear && onApply(option, releaseYear)}
                        disabled={isLoading}
                    >
                        {isLoading
                            ? <ActivityIndicator size="small" color="#fff" />
                            : <Text style={styles.applyButtonText}>Apply</Text>}
                    </TouchableOpacity>
                </View>
            );
        }

        if (option === 'Network') {
            return (
                <View style={styles.genreContainer}>
                    {networks.map((network) => (
                        <TouchableOpacity
                            key={network}
                            style={[styles.genreButton, selectedNetwork === network && styles.genreButtonSelected]}
                            onPress={() => {
                                setSelectedNetwork(network);
                                onApply(option, network);
                            }}
                            disabled={isLoading}
                        >
                            <Text style={[styles.genreText, selectedNetwork === network && styles.genreTextSelected]}>
                                {network}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            );
        }
    }

    // Fallback to null if no matching filter handled
    return null;
}

const styles = StyleSheet.create({
    genreContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 6,
    },
    genreButton: {
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderColor: '#888',
        borderWidth: 1,
        borderRadius: 20,
        marginRight: 6,
        marginBottom: 6,
        backgroundColor: 'transparent',
    },
    genreButtonSelected: {
        backgroundColor: '#3498db',
        borderColor: '#3498db',
    },
    genreText: {
        color: '#fff',
    },
    genreTextSelected: {
        fontWeight: 'bold',
    },
    inputContainer: {
        flexDirection: 'row',
        marginTop: 8,
    },
    input: {
        flex: 1,
        borderWidth: 1,
        borderColor: '#888',
        borderRadius: 8,
        paddingHorizontal: 10,
        color: '#fff',
        height: 40,
    },
    applyButton: {
        marginLeft: 10,
        backgroundColor: '#3498db',
        borderRadius: 8,
        paddingHorizontal: 15,
        justifyContent: 'center',
    },
    disabledButton: {
        backgroundColor: '#888',
    },
    applyButtonText: {
        color: '#fff',
    },
});
