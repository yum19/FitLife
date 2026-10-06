import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

interface TagInputProps {
  value: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  style?: any;
}

const TagInput: React.FC<TagInputProps> = ({ value, onChange, placeholder, style }) => {
  const [input, setInput] = useState('');

  const addTag = () => {
    const newTag = input.trim();
    if (newTag && !value.includes(newTag)) {
      onChange([...value, newTag]);
    }
    setInput('');
  };

  const removeTag = (tag: string) => {
    onChange(value.filter(t => t !== tag));
  };

  const handleInputChange = (text: string) => {
    // Add tag on comma or enter
    if (text.endsWith(',') || text.endsWith('\n')) {
      setInput(text.replace(/,|\n/g, ''));
      addTag();
    } else {
      setInput(text);
    }
  };

  return (
    <View style={[styles.container, style]}>
      <View style={styles.chipList}>
        {value.map(item => (
          <View style={styles.chip} key={item}>
            <Text style={styles.chipText}>{item}</Text>
            <TouchableOpacity onPress={() => removeTag(item)}>
              <Ionicons name="close-circle" size={18} color="#F97316" />
            </TouchableOpacity>
          </View>
        ))}
      </View>
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          value={input}
          onChangeText={handleInputChange}
          placeholder={placeholder}
          placeholderTextColor="#aaa"
          onSubmitEditing={addTag}
          blurOnSubmit={false}
        />
        <TouchableOpacity onPress={addTag} style={styles.addButton}>
          <Ionicons name="add-circle" size={24} color="#F97316" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  chipList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff3e6',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    marginBottom: 4,
  },
  chipText: {
    color: '#F97316',
    fontWeight: '600',
    marginRight: 4,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#F97316',
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#1a1a1a',
    paddingVertical: 6,
  },
  addButton: {
    marginLeft: 8,
  },
});

export default TagInput; 