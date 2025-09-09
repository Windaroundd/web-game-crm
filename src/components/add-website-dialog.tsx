"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { IconPlus } from "@tabler/icons-react";

const categories = ["blog", "tech", "gaming", "news", "entertainment"];

interface AddWebsiteDialogProps {
  onAddWebsite: (website: {
    url: string;
    title: string;
    desc: string;
    category: string;
    isGSA: boolean;
    isIndex: boolean;
    isFeatured: boolean;
    traffic: number;
    domain_rating: number;
    backlinks: number;
    referring_domains: number;
    is_wp: boolean;
  }) => void;
}

export function AddWebsiteDialog({ onAddWebsite }: AddWebsiteDialogProps) {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    url: "",
    title: "",
    desc: "",
    category: "",
    isGSA: false,
    isIndex: true,
    isFeatured: false,
    traffic: 0,
    domain_rating: 0,
    backlinks: 0,
    referring_domains: 0,
    is_wp: false,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.url || !formData.title || !formData.category) {
      return;
    }
    
    onAddWebsite(formData);
    setFormData({
      url: "",
      title: "",
      desc: "",
      category: "",
      isGSA: false,
      isIndex: true,
      isFeatured: false,
      traffic: 0,
      domain_rating: 0,
      backlinks: 0,
      referring_domains: 0,
      is_wp: false,
    });
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <IconPlus className="h-4 w-4 mr-2" />
          Add Website
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Website</DialogTitle>
          <DialogDescription>
            Add a new website to your portfolio. Fill in the details below.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="url">URL *</Label>
            <Input
              id="url"
              type="url"
              placeholder="https://example.com"
              value={formData.url}
              onChange={(e) => setFormData({ ...formData, url: e.target.value })}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              placeholder="Website title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="desc">Description</Label>
            <Textarea
              id="desc"
              placeholder="Brief description of the website"
              value={formData.desc}
              onChange={(e) => setFormData({ ...formData, desc: e.target.value })}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="category">Category *</Label>
            <Select
              value={formData.category}
              onValueChange={(value) => setFormData({ ...formData, category: value })}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat.charAt(0).toUpperCase() + cat.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="traffic">Traffic</Label>
              <Input
                id="traffic"
                type="number"
                min="0"
                placeholder="0"
                value={formData.traffic}
                onChange={(e) => setFormData({ ...formData, traffic: parseInt(e.target.value) || 0 })}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="domain_rating">Domain Rating</Label>
              <Input
                id="domain_rating"
                type="number"
                min="0"
                max="100"
                placeholder="0"
                value={formData.domain_rating}
                onChange={(e) => setFormData({ ...formData, domain_rating: parseInt(e.target.value) || 0 })}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="backlinks">Backlinks</Label>
              <Input
                id="backlinks"
                type="number"
                min="0"
                placeholder="0"
                value={formData.backlinks}
                onChange={(e) => setFormData({ ...formData, backlinks: parseInt(e.target.value) || 0 })}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="referring_domains">Referring Domains</Label>
              <Input
                id="referring_domains"
                type="number"
                min="0"
                placeholder="0"
                value={formData.referring_domains}
                onChange={(e) => setFormData({ ...formData, referring_domains: parseInt(e.target.value) || 0 })}
              />
            </div>
          </div>
          
          <div className="space-y-3">
            <Label>Website Properties</Label>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="isIndex"
                checked={formData.isIndex}
                onCheckedChange={(checked) => setFormData({ ...formData, isIndex: !!checked })}
              />
              <Label htmlFor="isIndex" className="text-sm font-normal">
                Indexed by search engines
              </Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="isGSA"
                checked={formData.isGSA}
                onCheckedChange={(checked) => setFormData({ ...formData, isGSA: !!checked })}
              />
              <Label htmlFor="isGSA" className="text-sm font-normal">
                GSA (Google Search Appliance)
              </Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="isFeatured"
                checked={formData.isFeatured}
                onCheckedChange={(checked) => setFormData({ ...formData, isFeatured: !!checked })}
              />
              <Label htmlFor="isFeatured" className="text-sm font-normal">
                Featured website
              </Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="is_wp"
                checked={formData.is_wp}
                onCheckedChange={(checked) => setFormData({ ...formData, is_wp: !!checked })}
              />
              <Label htmlFor="is_wp" className="text-sm font-normal">
                WordPress site
              </Label>
            </div>
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Add Website</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}