import React from 'react'
import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'

interface UnitsSearchProps {
    value: string;
    onChange: (value: string) => void;
}

export const UnitsSearch = ({ value, onChange }: UnitsSearchProps) => {
    return (
        <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
            <Input
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder="Search units..."
                className="pl-9 bg-[#0A0A0A] border-gray-800 text-gray-200 placeholder:text-gray-500 focus-visible:ring-1 focus-visible:ring-green-500/50 w-[300px] h-10"
            />
        </div>
    )
}
